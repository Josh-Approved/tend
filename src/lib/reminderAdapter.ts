/**
 * APP-OWNED. The one file the canonical `reminders` module asks this app to
 * write (synced ifAbsent, never clobbered). It is the whole of what
 * Relationships knows about reminders; every fire-time decision lives in the
 * pure planner (`../data/reminderPlan`) and every OS call in the scheduler
 * (`./reminderScheduler`).
 *
 * Three jobs:
 *   1. `reminderItems()` — map this app's domain onto the neutral `ReminderItem`
 *      shape. Two reasons produce items: a person's reach-out cadence, and each
 *      important date they have saved.
 *   2. `reminderCopy()` — one planned reminder into a title and body, through
 *      `t()`. Calm and plain (canon § Notifications).
 *   3. The app-owned "Remind me about birthdays" setting, which is a filter over
 *      the date items rather than anything the module knows about.
 *
 * WHY REACH-OUTS ARE 'exact' AND DATES ARE 'hour'. A reach-out is due at a real
 * instant — `lastContactedAt + cadenceDays` — so the OS should hit it precisely,
 * and it keeps delivering with the app closed. An important date is due on a
 * DAY, so it fires at the app-wide notification hour the user chose in Settings.
 *
 * PERMISSION. `optInToReminders` is the only call that may raise the OS dialog,
 * and the scheduler computes the plan BEFORE asking — so an opt-in that would
 * arm nothing (a date already past for this year, birthdays switched off) never
 * raises it at all. Canon § Notifications: ask at the point of value only.
 */

import { t } from '../i18n';
import {
  activePeople,
  dueStatus,
  isBirthday,
  nextOccurrence,
  type Person,
} from '../data/person';
import { getAppSetting, setAppSetting } from '../storage/kv';
import type { PlannedReminder, ReminderItem } from '../data/reminderPlan';
import { rescheduleReminders } from './reminderScheduler';

/** The reminder-item id for a person's reach-out cadence. */
export const reachOutItemId = (personId: string): string => `reachout:${personId}`;
/** The reminder-item id for one saved important date. */
export const dateItemId = (dateId: string): string => `date:${dateId}`;

// ---------- The birthday-reminders setting (app-owned) ----------

/**
 * "Remind me about birthdays" — ON unless the user turned it off in Settings.
 * A birthday you typed in is a thing you want to be reminded of, so the default
 * is on; the permission ask still only happens at the point of value (saving a
 * date), never at launch. Stored as a plain app setting so it survives restarts.
 *
 * Every OTHER important date always plans — the user typed those in one at a
 * time, so each one is its own explicit opt-in.
 */
export const BIRTHDAY_REMINDERS_KEY = 'birthdayRemindersEnabled';

export async function getBirthdayRemindersEnabled(): Promise<boolean> {
  try {
    const raw = await getAppSetting(BIRTHDAY_REMINDERS_KEY);
    // Unset = on. Only an explicit "0" turns them off.
    return raw !== '0';
  } catch {
    return true;
  }
}

export async function setBirthdayRemindersEnabled(enabled: boolean): Promise<void> {
  try {
    await setAppSetting(BIRTHDAY_REMINDERS_KEY, enabled ? '1' : '0');
  } catch {
    // best-effort; the toggle still reflects the session's choice
  }
}

// ---------- Carrying the old "already notified" marks across ----------

/**
 * Before the canonical module, this app kept its own notified marks under
 * `reachoutNotifiedMarks`, keyed by the bare person id. The module keeps them
 * under `reminderMarks`, keyed by the reminder-item id (`reachout:<personId>`).
 *
 * Starting from an empty ledger would cost every existing beta tester one
 * duplicate catch-up nudge for a person who is already overdue, so the old
 * value is carried across once — key renamed AND each entry re-namespaced.
 * Runs at most once per install (flagged), is idempotent, and never overwrites
 * marks the module has already written.
 */
const LEGACY_MARKS_KEY = 'reachoutNotifiedMarks';
const MARKS_KEY = 'reminderMarks';
const MARKS_MIGRATED_KEY = 'reminderMarksMigrated';

let migration: Promise<void> | null = null;

/** Idempotent, memoized — every entry point awaits it before planning. */
export function migrateReminderMarks(): Promise<void> {
  if (!migration) migration = runMarksMigration();
  return migration;
}

async function runMarksMigration(): Promise<void> {
  try {
    if (await getAppSetting(MARKS_MIGRATED_KEY)) return;
    // Never clobber a ledger the module has already written.
    if (!(await getAppSetting(MARKS_KEY))) {
      const raw = await getAppSetting(LEGACY_MARKS_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        const carried: Record<string, number> = {};
        for (const [personId, dueAt] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof dueAt === 'number' && Number.isFinite(dueAt)) {
            carried[reachOutItemId(personId)] = dueAt;
          }
        }
        if (Object.keys(carried).length > 0) {
          await setAppSetting(MARKS_KEY, JSON.stringify(carried));
        }
      }
    }
    await setAppSetting(MARKS_MIGRATED_KEY, '1');
  } catch {
    // best-effort: the worst case is one duplicate nudge, never a missed one
  }
}

/** Test seam — forget the memoized run so a fresh store can migrate again. */
export function resetMarksMigrationForTests(): void {
  migration = null;
}

// ---------- Domain -> the neutral item shape ----------

export interface ReminderItemsOptions {
  /** Skip birthday-labeled dates (the Settings toggle is off). */
  excludeBirthdays?: boolean;
}

/**
 * One item per thing that can be due. Ids are namespaced per reason because one
 * person produces several items and the id is the dedup key for the mark.
 *
 * Reach-outs carry `catchUpWhenOverdue` so someone who was already overdue when
 * the plan ran (a cadence set on a stale contact, permission granted late) gets
 * exactly one nudge rather than none — and `cycleDays`, so the planner can never
 * put a reminder before the previous cycle.
 */
export function reminderItems(people: Person[], opts: ReminderItemsOptions = {}): ReminderItem[] {
  const now = Date.now();
  const items: ReminderItem[] = [];

  for (const p of activePeople(people)) {
    const name = p.name.trim();

    const due = dueStatus(p, now);
    if (due.dueAt != null) {
      items.push({
        id: reachOutItemId(p.id),
        dueAt: due.dueAt,
        label: name,
        kindKey: 'reachOut',
        timing: 'exact',
        catchUpWhenOverdue: true,
        cycleDays: p.cadenceDays,
      });
    }

    for (const d of p.importantDates) {
      if (opts.excludeBirthdays && isBirthday(d)) continue;
      items.push({
        id: dateItemId(d.id),
        dueAt: nextOccurrence(d, now),
        label: name,
        kindKey: isBirthday(d) ? 'birthday' : 'importantDate',
        timing: 'hour',
        meta: { dateLabel: d.label },
      });
    }
  }

  return items;
}

/** Copy for one planned reminder, resolved through i18n. */
export function reminderCopy(reminder: PlannedReminder): { title: string; body: string } {
  const name = reminder.label.trim() || t('person.untitled');
  if (reminder.kindKey === 'birthday' || reminder.kindKey === 'importantDate') {
    const label = typeof reminder.meta?.dateLabel === 'string' ? reminder.meta.dateLabel : '';
    return { title: t('notify.dateTitle', { name, label }), body: t('notify.dateBody') };
  }
  return { title: t('notify.reachOutTitle', { name }), body: t('notify.reachOutBody') };
}

// ---------- The two entry points the app calls ----------

async function itemsForCurrentSettings(people: Person[]): Promise<ReminderItem[]> {
  const excludeBirthdays = !(await getBirthdayRemindersEnabled());
  return reminderItems(people, { excludeBirthdays });
}

/**
 * Re-arm from the current people. NEVER prompts, so it is safe from any store
 * mutation, from hydrate, and from a Settings toggle. Awaitable (the birthday
 * setting is a disk read) but the callers treat it as fire-and-forget.
 */
export async function syncAppReminders(people: Person[]): Promise<void> {
  await migrateReminderMarks();
  await rescheduleReminders(await itemsForCurrentSettings(people), reminderCopy, {
    channelName: t('notify.channelName'),
  });
}

/**
 * Re-arm from an EXPLICIT opt-in — setting a cadence, saving a birthday or
 * date, importing people who brought dates with them. This is the only call
 * that may raise the OS permission dialog, and the scheduler only raises it when
 * the plan would actually arm something.
 */
export async function optInToReminders(people: Person[]): Promise<void> {
  await migrateReminderMarks();
  await rescheduleReminders(await itemsForCurrentSettings(people), reminderCopy, {
    prompt: true,
    channelName: t('notify.channelName'),
  });
}

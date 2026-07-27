/**
 * Local, on-device reminder scheduling (canon: no server, no account). Given the
 * current people, it cancels every scheduled reminder and re-schedules:
 *   - a "time to reach out" nudge when someone is due (per their cadence), and
 *   - a morning-of reminder for each upcoming important date.
 *
 * Permission is only ever *requested* on an explicit opt-in (setting a cadence,
 * or saving a birthday / important date) — never on cold launch, and only when
 * the opt-in actually produces a reminder to arm. Background re-syncs reschedule
 * only if already granted, so the app never nags. Everything is best-effort and defensive: if permission is
 * denied or the OS throws, it no-ops; the app never depends on it. Copy via t().
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { type Person, type PlannedReminder, planReminders } from '../data/person';
import { getAppSetting, setAppSetting } from '../storage/kv';
import { t } from '../i18n';

// Show scheduled reminders even if the app is foregrounded when one fires.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // handler shape differs across versions — non-fatal
}

let granted = false;

async function hasPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    granted = current.granted;
    return current.granted;
  } catch {
    return false;
  }
}

/** Request permission — call only on an explicit user opt-in. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (await hasPermission()) return true;
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
    return req.granted;
  } catch {
    return false;
  }
}

async function ensureChannel(): Promise<void> {
  // Notification channels are an Android-only concept; a no-op elsewhere.
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {
      // non-fatal
    }
  }
}

async function scheduleAt(ms: number, title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(ms) },
    });
  } catch {
    // a single bad trigger shouldn't sink the rest
  }
}

/** Copy for one planned reminder, resolved through i18n. */
function copyFor(r: PlannedReminder): { title: string; body: string } {
  const name = r.personName || t('person.untitled');
  if (r.kind === 'importantDate') {
    return { title: t('notify.dateTitle', { name, label: r.dateLabel ?? '' }), body: t('notify.dateBody') };
  }
  return { title: t('notify.reachOutTitle', { name }), body: t('notify.reachOutBody') };
}

// Which reach-out due-cycles we've already armed a nudge for, so reopening the
// app can't re-fire an overdue nudge (persisted; keyed by person id → dueAt).
const MARKS_KEY = 'reachoutNotifiedMarks';

async function loadMarks(): Promise<Record<string, number>> {
  try {
    const raw = await getAppSetting(MARKS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

async function saveMarks(marks: Record<string, number>): Promise<void> {
  try {
    await setAppSetting(MARKS_KEY, JSON.stringify(marks));
  } catch {
    // best-effort; a lost mark can only cost one extra nudge, never a missed one
  }
}

/**
 * "Remind me about birthdays" — ON unless the user turned it off in Settings.
 * A birthday you typed in is a thing you want to be reminded of, so the default
 * is on; the permission ask still only happens at the point of value (saving a
 * date), never at launch. Stored as a plain app setting so it survives restarts.
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

/**
 * Cancel all and re-schedule from the current people. Safe to call often — the
 * fire-time decisions (and the overdue-nudge dedup) live in the pure
 * `planReminders`. Pass { prompt: true } only from an explicit opt-in; otherwise
 * it reschedules only when permission is already granted and never prompts.
 *
 * The plan is computed BEFORE the permission ask so an opt-in that would arm
 * nothing (a date already past for this year, birthdays switched off) never
 * raises the OS dialog — canon § Notifications: ask at the point of value only.
 */
export async function rescheduleAll(people: Person[], opts: { prompt?: boolean } = {}): Promise<void> {
  try {
    const excludeBirthdays = !(await getBirthdayRemindersEnabled());
    const prevMarks = await loadMarks();
    const { reminders, marks } = planReminders(people, Date.now(), prevMarks, undefined, { excludeBirthdays });
    const ok =
      opts.prompt && reminders.length > 0 ? await ensureNotificationPermission() : await hasPermission();
    if (!ok) return;
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const r of reminders) {
      const { title, body } = copyFor(r);
      await scheduleAt(r.at, title, body);
    }
    await saveMarks(marks);
  } catch {
    // never throw into the UI
  }
}

/**
 * Local, on-device reminder scheduling (canon: no server, no account). Given the
 * current people, it cancels every scheduled reminder and re-schedules:
 *   - a "time to reach out" nudge when someone is due (per their cadence), and
 *   - a morning-of reminder for each upcoming important date.
 *
 * Permission is only ever *requested* on an explicit opt-in (setting a cadence) —
 * never on cold launch. Background re-syncs reschedule only if already granted, so
 * the app never nags. Everything is best-effort and defensive: if permission is
 * denied or the OS throws, it no-ops; the app never depends on it. Copy via t().
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { type Person, activePeople, dueStatus, nextOccurrence } from '../data/person';
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

/**
 * Cancel all and re-schedule from the current people. Safe to call often.
 * Pass { prompt: true } only from an explicit opt-in; otherwise it reschedules
 * only when permission is already granted and never prompts.
 */
export async function rescheduleAll(people: Person[], opts: { prompt?: boolean } = {}): Promise<void> {
  try {
    const ok = opts.prompt ? await ensureNotificationPermission() : await hasPermission();
    if (!ok) return;
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = Date.now();
    for (const p of activePeople(people)) {
      const name = p.name.trim() || t('person.untitled');
      const due = dueStatus(p, now);
      if (due.dueAt != null) {
        const when = Math.max(due.dueAt, now + 60_000); // never in the past
        await scheduleAt(when, t('notify.reachOutTitle', { name }), t('notify.reachOutBody'));
      }
      for (const d of p.importantDates) {
        const morning = new Date(nextOccurrence(d, now));
        morning.setHours(9, 0, 0, 0);
        if (morning.getTime() > now) {
          await scheduleAt(morning.getTime(), t('notify.dateTitle', { name, label: d.label }), t('notify.dateBody'));
        }
      }
    }
  } catch {
    // never throw into the UI
  }
}

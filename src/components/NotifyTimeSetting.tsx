/**
 * App-wide notification-time setting: one preset hour every day-shaped reminder
 * fires at (per-person times would be flexibility nobody needs, and more knobs
 * is not more calm). Reach-out nudges are unaffected — those fire at the exact
 * cadence moment, not on a calendar day.
 *
 * The row lives in the Settings scroll; the pane must be rendered by the SCREEN
 * at its root (design system § Hub-and-spoke drill-downs), so this module
 * exports the pieces — a state hook, the row value formatter, and the pane — and
 * SettingsScreen composes them. Picking an hour persists it and reschedules
 * everything immediately (never prompts).
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { atHour, DEFAULT_NOTIFY_HOUR } from '../data/reminderPlan';
import { getNotifyHour, setNotifyHour, NOTIFY_HOUR_PRESETS } from '../lib/reminderScheduler';
import { syncAppReminders } from '../lib/reminderAdapter';
import { usePeopleStore } from '../store/people';
import { DrilldownSheet } from './DrilldownSheet';
import { OptionChips } from './OptionChips';
import { t, formatDate } from '../i18n';
import { space, boundedContent } from '../theme';

/** The hour rendered in the device's own clock convention (12h / 24h). */
export function hourText(hour: number): string {
  return formatDate(atHour(Date.now(), hour), { hour: 'numeric', minute: '2-digit' });
}

/** Current notify hour + a picker that persists and reschedules. */
export function useNotifyHour(): [number, (h: number) => void] {
  const [hour, setHour] = useState<number>(DEFAULT_NOTIFY_HOUR);

  useEffect(() => {
    getNotifyHour()
      .then(setHour)
      .catch(() => {});
  }, []);

  const pick = (next: number) => {
    setHour(next);
    setNotifyHour(next)
      .then(() => syncAppReminders(usePeopleStore.getState().people))
      .catch(() => {});
  };

  return [hour, pick];
}

type PaneProps = {
  visible: boolean;
  hour: number;
  onClose: () => void;
  onPick: (hour: number) => void;
};

export function NotifyTimePane({ visible, hour, onClose, onPick }: PaneProps) {
  return (
    <DrilldownSheet visible={visible} title={t('settings.notifyTime')} onClose={onClose}>
      <View style={s.body}>
        <OptionChips
          options={NOTIFY_HOUR_PRESETS.map((h) => ({ key: String(h), label: hourText(h) }))}
          selectedKey={String(hour)}
          onPick={(k) => onPick(Number(k))}
        />
      </View>
    </DrilldownSheet>
  );
}

const s = StyleSheet.create({
  body: { ...boundedContent, paddingHorizontal: space.s6, paddingTop: space.s5 },
});

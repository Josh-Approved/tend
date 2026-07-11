/**
 * Cadence spoke: how often to reach out — the five presets as a full list
 * instead of a chip row on the person hub. Single select; choosing returns
 * immediately (hub-and-spoke pattern, canon proposal home-maintenance-20260710-1).
 */

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { CADENCE_PRESETS } from '../data/person';
import { DrilldownSheet, SheetOption } from './DrilldownSheet';
import { t } from '../i18n';
import { boundedContent, space } from '../theme';

export function cadenceLabel(days: number | null): string {
  const key = CADENCE_PRESETS.find((p) => p.days === days)?.key ?? 'none';
  return t(`person.cadence${key.charAt(0).toUpperCase()}${key.slice(1)}`);
}

type Props = {
  visible: boolean;
  value: number | null;
  onClose: () => void;
  onPick: (days: number | null) => void;
};

export function CadenceSheet({ visible, value, onClose, onPick }: Props) {
  return (
    <DrilldownSheet visible={visible} title={t('person.cadenceLabel')} onClose={onClose}>
      <ScrollView contentContainerStyle={s.list}>
        {CADENCE_PRESETS.map((preset) => (
          <SheetOption
            key={preset.key}
            label={cadenceLabel(preset.days)}
            selected={value === preset.days}
            onPress={() => {
              onPick(preset.days);
              onClose();
            }}
          />
        ))}
      </ScrollView>
    </DrilldownSheet>
  );
}

const s = StyleSheet.create({
  list: { ...boundedContent, paddingBottom: space.s9 },
});

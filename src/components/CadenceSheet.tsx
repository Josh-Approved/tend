/**
 * Cadence spoke: how often to reach out — five short single-select presets,
 * so they render as OptionChips (design system § Hub-and-spoke drill-downs).
 * Choosing returns immediately.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CADENCE_PRESETS } from '../data/person';
import { DrilldownSheet } from './DrilldownSheet';
import { OptionChips } from './OptionChips';
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
  const selected = CADENCE_PRESETS.find((p) => p.days === value)?.key ?? 'none';
  return (
    <DrilldownSheet visible={visible} title={t('person.cadenceLabel')} onClose={onClose}>
      <View style={s.body}>
        <OptionChips
          options={CADENCE_PRESETS.map((p) => ({ key: p.key, label: cadenceLabel(p.days) }))}
          selectedKey={selected}
          onPick={(key) => {
            const preset = CADENCE_PRESETS.find((p) => p.key === key);
            onPick(preset ? preset.days : null);
            onClose();
          }}
        />
      </View>
    </DrilldownSheet>
  );
}

const s = StyleSheet.create({
  body: { ...boundedContent, paddingHorizontal: space.s6, paddingTop: space.s5 },
});

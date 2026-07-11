/**
 * Important-dates spoke: the person's dates with the add form, lifted off the
 * hub so the three-field entry (label / MM / DD) has room and the hub row can
 * stay a one-line summary ("Birthday · in 9d"). Live writes; Back is done.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { nextOccurrence, daysUntil, type ImportantDate } from '../data/person';
import { DrilldownSheet } from './DrilldownSheet';
import { t } from '../i18n';
import {
  useTheme,
  fontFamily,
  space,
  target,
  type as ty,
  hairline,
  radius,
  boundedContent,
  type Colors,
} from '../theme';

export function formatMonthDay(month: number, day: number): string {
  return new Date(2001, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

type Props = {
  visible: boolean;
  dates: ImportantDate[];
  onClose: () => void;
  onAdd: (label: string, month: number, day: number) => void;
  onRemove: (id: string) => void;
};

export function DatesSheet({ visible, dates, onClose, onAdd, onRemove }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const now = Date.now();
  const [label, setLabel] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const add = () => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return;
    onAdd(label.trim() || t('person.datesLabel'), m, d);
    setLabel('');
    setMonth('');
    setDay('');
  };

  return (
    <DrilldownSheet visible={visible} title={t('person.datesLabel')} onClose={onClose}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {dates.map((d) => {
          const du = daysUntil(nextOccurrence(d, now), now);
          const rel = du === 0 ? t('person.dateToday') : t('person.inDays', { days: du });
          return (
            <View key={d.id} style={s.listRow}>
              <Text style={s.listRowText}>
                {d.label} · {formatMonthDay(d.month, d.day)} · {rel}
              </Text>
              <Pressable
                onPress={() => onRemove(d.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('person.remove')}
                style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
              >
                <Trash2 size={16} color={c.fgSubtle} strokeWidth={1.5} />
              </Pressable>
            </View>
          );
        })}

        <View style={s.addRow}>
          <TextInput
            style={[s.input, s.flex1]}
            value={label}
            onChangeText={setLabel}
            placeholder={t('person.dateLabelPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.dateLabelPlaceholder')}
          />
          <TextInput
            style={[s.input, s.numInput]}
            value={month}
            onChangeText={setMonth}
            placeholder={t('person.monthPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.monthPlaceholder')}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={[s.input, s.numInput]}
            value={day}
            onChangeText={setDay}
            placeholder={t('person.dayPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.dayPlaceholder')}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Pressable
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel={t('person.addDate')}
            style={({ pressed }) => [s.addBtn, pressed && s.pressed]}
          >
            <Plus size={20} color={c.inkButtonText} strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
    </DrilldownSheet>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    pressed: { opacity: 0.6 },
    flex1: { flex: 1 },
    body: { ...boundedContent, paddingHorizontal: space.s6, paddingBottom: space.s9 },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    listRowText: { ...ty.base, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s4 },
    input: {
      minHeight: target.min,
      paddingHorizontal: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
    },
    numInput: { width: 56, textAlign: 'center' },
    addBtn: {
      width: target.min,
      height: target.min,
      borderRadius: radius.md,
      backgroundColor: c.inkButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

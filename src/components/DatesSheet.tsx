/**
 * Important-dates spoke: a first-class Birthday field pinned at the top (its own
 * structured MM/DD entry, at most one per person), then any other dates
 * (anniversaries, the day you met…) with the generic add form. Lifted off the
 * hub so entry has room and the hub row stays a one-line summary. Live writes;
 * Back is done.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Plus, Trash2, Check } from 'lucide-react-native';
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

/** "· in 9d" / "· today" relative suffix for a stored month/day. */
function relativeSuffix(d: ImportantDate, now: number): string {
  const du = daysUntil(nextOccurrence(d, now), now);
  return du === 0 ? t('person.dateToday') : t('person.inDays', { days: du });
}

type Props = {
  visible: boolean;
  birthday?: ImportantDate;
  otherDates: ImportantDate[];
  onClose: () => void;
  onSetBirthday: (month: number, day: number) => void;
  onClearBirthday: () => void;
  onAdd: (label: string, month: number, day: number) => void;
  onRemove: (id: string) => void;
};

export function DatesSheet({
  visible,
  birthday,
  otherDates,
  onClose,
  onSetBirthday,
  onClearBirthday,
  onAdd,
  onRemove,
}: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const now = Date.now();

  // Birthday inputs — prefilled from the stored birthday whenever the sheet opens.
  const [bMonth, setBMonth] = useState('');
  const [bDay, setBDay] = useState('');
  useEffect(() => {
    if (!visible) return;
    setBMonth(birthday ? String(birthday.month) : '');
    setBDay(birthday ? String(birthday.day) : '');
    // Only re-seed when the sheet opens (or the stored birthday changes).
  }, [visible, birthday]);

  // Generic (non-birthday) date inputs.
  const [label, setLabel] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const saveBirthday = () => {
    const m = parseInt(bMonth, 10);
    const d = parseInt(bDay, 10);
    if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return;
    onSetBirthday(m, d);
  };

  const birthdayDirty = birthday ? String(birthday.month) !== bMonth || String(birthday.day) !== bDay : !!(bMonth || bDay);
  const birthdayValid = (() => {
    const m = parseInt(bMonth, 10);
    const d = parseInt(bDay, 10);
    return m >= 1 && m <= 12 && d >= 1 && d <= 31;
  })();

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
        {/* Birthday — first-class, pinned, at most one. */}
        <Text style={s.sectionLabel}>{t('person.birthdayLabel')}</Text>
        <View style={s.addRow}>
          <TextInput
            style={[s.input, s.numInput]}
            value={bMonth}
            onChangeText={setBMonth}
            placeholder={t('person.monthPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={`${t('person.birthdayLabel')} ${t('person.monthPlaceholder')}`}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={[s.input, s.numInput]}
            value={bDay}
            onChangeText={setBDay}
            placeholder={t('person.dayPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={`${t('person.birthdayLabel')} ${t('person.dayPlaceholder')}`}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Pressable
            onPress={saveBirthday}
            disabled={!birthdayDirty || !birthdayValid}
            accessibilityRole="button"
            accessibilityLabel={t('common.save')}
            style={({ pressed }) => [
              s.addBtn,
              pressed && s.pressed,
              (!birthdayDirty || !birthdayValid) && s.addBtnDisabled,
            ]}
          >
            <Check size={20} color={c.inkButtonText} strokeWidth={2.5} />
          </Pressable>
          {birthday && (
            <Pressable
              onPress={onClearBirthday}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('person.remove')}
              style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            >
              <Trash2 size={18} color={c.fgSubtle} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
        {birthday && (
          <Text style={s.birthdayCurrent}>
            {formatMonthDay(birthday.month, birthday.day)} · {relativeSuffix(birthday, now)}
          </Text>
        )}

        {/* Other dates — anniversaries, the day you met, anything else. */}
        <Text style={[s.sectionLabel, s.sectionLabelSpaced]}>{t('person.otherDatesLabel')}</Text>
        {otherDates.map((d) => (
          <View key={d.id} style={s.listRow}>
            <Text style={s.listRowText}>
              {d.label} · {formatMonthDay(d.month, d.day)} · {relativeSuffix(d, now)}
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
        ))}

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
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingBottom: space.s3,
    },
    sectionLabelSpaced: { paddingTop: space.s7 },
    birthdayCurrent: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingTop: space.s3 },
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
    addBtnDisabled: { opacity: 0.4 },
  });
}

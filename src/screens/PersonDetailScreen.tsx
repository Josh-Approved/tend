/**
 * Person detail — the practical memory you keep about one person, plus your
 * catch-up history. Core loop: pick how you connected (call / text / in person),
 * optionally note what you talked about, tap "I reached out" — it logs the
 * catch-up and resets their clock. Below: cadence, how you met, notes, important
 * dates, and likes/dislikes/gift ideas. Depth accretes a little at a time.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Plus, Trash2, X } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { usePeopleStore } from '../store/people';
import {
  daysSinceContact,
  nextOccurrence,
  daysUntil,
  sortedInteractions,
  personalityValue,
  CADENCE_PRESETS,
  INTERACTION_KINDS,
  type PreferenceKind,
  type InteractionKind,
} from '../data/person';
import {
  PERSONALITY_CATALOG,
  frameworkLabelKey,
  optionShortKey,
  optionLabelKey,
  optionRelateKey,
} from '../data/personality';
import { ScreenHeader } from '../components/ScreenHeader';
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

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

function formatMonthDay(month: number, day: number): string {
  return new Date(2001, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PersonDetailScreen({ route, navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { personId } = route.params;
  const person = usePeopleStore((st) => st.people.find((p) => p.id === personId));

  const renamePerson = usePeopleStore((st) => st.renamePerson);
  const setCadence = usePeopleStore((st) => st.setCadence);
  const logContact = usePeopleStore((st) => st.logContact);
  const setNotes = usePeopleStore((st) => st.setNotes);
  const setHowWeMet = usePeopleStore((st) => st.setHowWeMet);
  const addImportantDate = usePeopleStore((st) => st.addImportantDate);
  const removeImportantDate = usePeopleStore((st) => st.removeImportantDate);
  const addPreference = usePeopleStore((st) => st.addPreference);
  const removePreference = usePeopleStore((st) => st.removePreference);
  const setPersonalityType = usePeopleStore((st) => st.setPersonalityType);
  const deletePerson = usePeopleStore((st) => st.deletePerson);

  const [logKind, setLogKind] = useState<InteractionKind>('call');
  const [logNote, setLogNote] = useState('');
  const [dateLabel, setDateLabel] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [prefKind, setPrefKind] = useState<PreferenceKind>('like');
  const [prefText, setPrefText] = useState('');

  if (!person) {
    navigation.goBack();
    return null;
  }

  const now = Date.now();
  const displayName = person.name.trim() || t('person.newPerson');
  const since = daysSinceContact(person, now);
  const statusText =
    person.lastContactedAt == null
      ? t('person.lastReachedNever')
      : since === 0
        ? t('person.lastReachedToday')
        : t('person.lastReachedDays', { days: since });

  const cadenceLabels: Record<string, string> = {
    none: t('person.cadenceNone'),
    weekly: t('person.cadenceWeekly'),
    biweekly: t('person.cadenceBiweekly'),
    monthly: t('person.cadenceMonthly'),
    quarterly: t('person.cadenceQuarterly'),
  };

  const kindLabel = (k: InteractionKind): string =>
    k === 'call'
      ? t('person.logKindCall')
      : k === 'text'
        ? t('person.logKindText')
        : k === 'inPerson'
          ? t('person.logKindInPerson')
          : t('person.logKindOther');

  const prefKinds: PreferenceKind[] = ['like', 'dislike', 'gift'];
  const prefKindLabel = (k: PreferenceKind) => t(`person.${k}`);
  const history = sortedInteractions(person).slice(0, 6);

  const onLog = () => {
    logContact(person.id, logKind, logNote);
    setLogNote('');
  };

  const onAddDate = () => {
    const month = parseInt(dateMonth, 10);
    const day = parseInt(dateDay, 10);
    if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) return;
    addImportantDate(person.id, dateLabel.trim() || t('person.datesLabel'), month, day);
    setDateLabel('');
    setDateMonth('');
    setDateDay('');
  };

  const onAddPref = () => {
    if (!prefText.trim()) return;
    addPreference(person.id, prefKind, prefText);
    setPrefText('');
  };

  const onDelete = () => {
    Alert.alert(t('person.deleteConfirmTitle', { name: displayName }), t('person.deleteConfirmBody'), [
      { text: t('person.cancel'), style: 'cancel' },
      {
        text: t('person.confirmRemove'),
        style: 'destructive',
        onPress: () => {
          deletePerson(person.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={displayName} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Name */}
        <TextInput
          style={s.nameInput}
          value={person.name}
          onChangeText={(v) => renamePerson(person.id, v)}
          placeholder={t('person.namePlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('person.namePlaceholder')}
        />

        {/* Log a catch-up */}
        <View style={s.chips}>
          {INTERACTION_KINDS.map((k) => {
            const selected = logKind === k;
            return (
              <Pressable
                key={k}
                onPress={() => setLogKind(k)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={kindLabel(k)}
                style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed]}
              >
                <Text style={[s.chipText, selected && s.chipTextOn]}>{kindLabel(k)}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={[s.input, s.logNote]}
          value={logNote}
          onChangeText={setLogNote}
          placeholder={t('person.logNotePlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('person.logNotePlaceholder')}
        />
        <Pressable
          onPress={onLog}
          accessibilityRole="button"
          accessibilityLabel={t('person.reachedOut')}
          style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
        >
          <Check size={18} color={c.inkButtonText} strokeWidth={2.5} />
          <Text style={s.primaryBtnText}>{t('person.reachedOut')}</Text>
        </Pressable>
        <Text style={s.status}>{statusText}</Text>

        {/* History */}
        {history.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t('person.historyLabel')}</Text>
            {history.map((i) => (
              <View key={i.id} style={s.historyRow}>
                <Text style={s.historyDate}>
                  {new Date(i.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={s.historyText}>
                  {kindLabel(i.kind)}
                  {i.note ? ` · ${i.note}` : ''}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Cadence */}
        <Text style={s.sectionLabel}>{t('person.cadenceLabel')}</Text>
        <View style={s.chips}>
          {CADENCE_PRESETS.map((preset) => {
            const selected = person.cadenceDays === preset.days;
            return (
              <Pressable
                key={preset.key}
                onPress={() => setCadence(person.id, preset.days)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={cadenceLabels[preset.key]}
                style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed]}
              >
                <Text style={[s.chipText, selected && s.chipTextOn]}>{cadenceLabels[preset.key]}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* How you met */}
        <Text style={s.sectionLabel}>{t('person.howWeMetLabel')}</Text>
        <TextInput
          style={s.input}
          value={person.howWeMet ?? ''}
          onChangeText={(v) => setHowWeMet(person.id, v)}
          placeholder={t('person.howWeMetPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('person.howWeMetLabel')}
        />

        {/* Notes */}
        <Text style={s.sectionLabel}>{t('person.notesLabel')}</Text>
        <TextInput
          style={s.notes}
          value={person.notes}
          onChangeText={(v) => setNotes(person.id, v)}
          placeholder={t('person.notesPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('person.notesLabel')}
          multiline
          textAlignVertical="top"
        />

        {/* Important dates */}
        <Text style={s.sectionLabel}>{t('person.datesLabel')}</Text>
        {person.importantDates.map((d) => {
          const du = daysUntil(nextOccurrence(d, now), now);
          const rel = du === 0 ? t('person.dateToday') : t('person.inDays', { days: du });
          return (
            <View key={d.id} style={s.listRow}>
              <Text style={s.listRowText}>
                {d.label} · {formatMonthDay(d.month, d.day)} · {rel}
              </Text>
              <Pressable
                onPress={() => removeImportantDate(person.id, d.id)}
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
            value={dateLabel}
            onChangeText={setDateLabel}
            placeholder={t('person.dateLabelPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.dateLabelPlaceholder')}
          />
          <TextInput
            style={[s.input, s.numInput]}
            value={dateMonth}
            onChangeText={setDateMonth}
            placeholder={t('person.monthPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.monthPlaceholder')}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={[s.input, s.numInput]}
            value={dateDay}
            onChangeText={setDateDay}
            placeholder={t('person.dayPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.dayPlaceholder')}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Pressable
            onPress={onAddDate}
            accessibilityRole="button"
            accessibilityLabel={t('person.addDate')}
            style={({ pressed }) => [s.addBtn, pressed && s.pressed]}
          >
            <Plus size={20} color={c.inkButtonText} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Likes / dislikes / gift ideas */}
        <Text style={s.sectionLabel}>{t('person.prefsLabel')}</Text>
        {person.preferences.map((pref) => (
          <View key={pref.id} style={s.listRow}>
            <Text style={s.prefTag}>{prefKindLabel(pref.kind)}</Text>
            <Text style={s.listRowText}>{pref.text}</Text>
            <Pressable
              onPress={() => removePreference(person.id, pref.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('person.remove')}
              style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            >
              <X size={16} color={c.fgSubtle} strokeWidth={1.5} />
            </Pressable>
          </View>
        ))}
        <View style={s.chips}>
          {prefKinds.map((k) => {
            const selected = prefKind === k;
            return (
              <Pressable
                key={k}
                onPress={() => setPrefKind(k)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={prefKindLabel(k)}
                style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed]}
              >
                <Text style={[s.chipText, selected && s.chipTextOn]}>{prefKindLabel(k)}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={s.addRow}>
          <TextInput
            style={[s.input, s.flex1]}
            value={prefText}
            onChangeText={setPrefText}
            onSubmitEditing={onAddPref}
            placeholder={t('person.prefPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.prefPlaceholder')}
            returnKeyType="done"
          />
          <Pressable
            onPress={onAddPref}
            disabled={!prefText.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('person.addPref')}
            style={({ pressed }) => [s.addBtn, pressed && s.pressed, !prefText.trim() && s.addBtnDisabled]}
          >
            <Plus size={20} color={c.inkButtonText} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Personality — depth as a lookup, not a questionnaire */}
        <Text style={s.sectionLabel}>{t('person.personalityLabel')}</Text>
        <Text style={s.personalityHint}>{t('person.personalityHint')}</Text>
        {PERSONALITY_CATALOG.map((cat) => {
          const selected = personalityValue(person, cat.framework);
          return (
            <View key={cat.framework} style={s.personalityBlock}>
              <Text style={s.personalitySubLabel}>{t(frameworkLabelKey(cat.framework))}</Text>
              <View style={s.chips}>
                {cat.values.map((v) => {
                  const on = selected === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setPersonalityType(person.id, cat.framework, on ? null : v)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={t(optionLabelKey(cat.framework, v))}
                      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && s.pressed]}
                    >
                      <Text style={[s.chipText, on && s.chipTextOn]}>{t(optionShortKey(cat.framework, v))}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selected ? (
                <View style={s.relateCard}>
                  <Text style={s.relateTitle}>{t(optionLabelKey(cat.framework, selected))}</Text>
                  <Text style={s.relateBody}>{t(optionRelateKey(cat.framework, selected))}</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        {/* Remove */}
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={t('person.deletePerson')}
          style={({ pressed }) => [s.deleteRow, pressed && s.pressed]}
        >
          <Trash2 size={18} color={c.fgMuted} strokeWidth={1.5} />
          <Text style={s.deleteText}>{t('person.deletePerson')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    flex1: { flex: 1 },
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: space.s9 },
    nameInput: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg, paddingVertical: space.s4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s2 },
    chip: {
      paddingHorizontal: space.s4,
      paddingVertical: space.s2,
      borderRadius: radius.pill,
      backgroundColor: c.bgSubtle,
      borderWidth: hairline,
      borderColor: c.hairline,
    },
    chipOn: { backgroundColor: c.fg, borderColor: c.fg },
    chipText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fg },
    chipTextOn: { color: c.bg, fontFamily: fontFamily.sansSemibold },
    input: {
      minHeight: target.min,
      paddingHorizontal: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
    },
    logNote: { marginTop: space.s3 },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.s2,
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.inkButton,
      paddingHorizontal: space.s5,
      marginTop: space.s3,
    },
    primaryBtnText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
    status: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingTop: space.s3, textAlign: 'center' },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s7,
      paddingBottom: space.s3,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: space.s3,
      paddingVertical: space.s2,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    historyDate: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fgMuted, width: 56 },
    historyText: { ...ty.sm, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    notes: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
      minHeight: 96,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      padding: space.s4,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    listRowText: { ...ty.base, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    prefTag: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.appAccent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    personalityHint: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingBottom: space.s2 },
    personalityBlock: { marginTop: space.s4 },
    personalitySubLabel: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fg, paddingBottom: space.s2 },
    relateCard: {
      marginTop: space.s3,
      padding: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      borderLeftWidth: 3,
      borderLeftColor: c.appAccent,
      gap: space.s2,
    },
    relateTitle: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.appAccent },
    relateBody: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fg, lineHeight: 20 },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s3 },
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
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s8, paddingVertical: space.s3 },
    deleteText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted },
  });
}

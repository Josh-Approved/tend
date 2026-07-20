/**
 * Person detail — the hub for one person. The ACTION (log a catch-up) stays
 * front and center with its history; everything you *know* about them —
 * cadence, how you met, notes, important dates, likes & gifts, personality —
 * is a summary row that opens its own focused sheet (hub-and-spoke, canon
 * proposal home-maintenance-20260710-1), so the hub reads as a receipt
 * instead of a wall of forms. Depth still accretes a little at a time.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Trash2, MessageCircleHeart, ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { usePeopleStore } from '../store/people';
import { useConversationsStore } from '../store/conversations';
import { openConversationsForPerson } from '../data/conversation';
import { flavorLabelKey } from '../data/conversationFramework';
import {
  daysSinceContact,
  nextOccurrence,
  daysUntil,
  sortedInteractions,
  personalityValue,
  INTERACTION_KINDS,
  type InteractionKind,
} from '../data/person';
import { PERSONALITY_CATALOG, optionShortKey } from '../data/personality';
import { ScreenHeader } from '../components/ScreenHeader';
import { DrilldownRow } from '../components/DrilldownRow';
import { CadenceSheet, cadenceLabel } from '../components/CadenceSheet';
import { PersonTextSheet } from '../components/PersonTextSheet';
import { DatesSheet } from '../components/DatesSheet';
import { PrefsSheet } from '../components/PrefsSheet';
import { PersonalitySheet } from '../components/PersonalitySheet';
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
type SheetId = 'cadence' | 'howWeMet' | 'notes' | 'dates' | 'prefs' | 'personality' | null;

/** First line of a prose field, shortened for a summary-row value. */
function preview(v: string | undefined): string {
  const line = (v ?? '').trim().split('\n')[0];
  return line.length > 36 ? `${line.slice(0, 36)}…` : line;
}

export default function PersonDetailScreen({ route, navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { personId } = route.params;
  // No personId → NEW mode: a draft that persists nothing until the user saves.
  const isNew = personId == null;
  const person = usePeopleStore((st) => st.people.find((p) => p.id === personId));

  const createPerson = usePeopleStore((st) => st.createPerson);
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
  const conversations = useConversationsStore((st) => st.conversations);
  const createConversation = useConversationsStore((st) => st.createConversation);

  const [logKind, setLogKind] = useState<InteractionKind>('call');
  const [logNote, setLogNote] = useState('');
  const [sheet, setSheet] = useState<SheetId>(null);
  // NEW-mode draft: a local cadence + name that aren't persisted until Save.
  const [draftName, setDraftName] = useState('');
  const [draftCadence, setDraftCadence] = useState<number | null>(null);
  const nameRef = useRef<TextInput>(null);

  // Keyboard up on mount in new mode. autoFocus handles iOS; the timed .focus()
  // is the Android-reliability belt-and-braces (autoFocus can no-op there).
  useEffect(() => {
    if (!isNew) return;
    const id = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [isNew]);

  // Only bounce when an explicit person was asked for but isn't there (deleted).
  // In new mode there is no person yet, and that's expected — don't bounce.
  if (!isNew && !person) {
    navigation.goBack();
    return null;
  }

  // NEW mode: a calm draft — name (autofocused) + the cadence row + a Save FAB.
  // Nothing is written to the store until Save, so backing out persists nothing.
  if (isNew) {
    const trimmedName = draftName.trim();
    const onSave = () => {
      if (!trimmedName) return;
      const id = createPerson(trimmedName);
      if (draftCadence != null) setCadence(id, draftCadence);
      // Become the normal edit screen for the new person (replace, not push, so
      // back from here returns to the directory, not to a stale draft).
      navigation.replace('PersonDetail', { personId: id });
    };
    return (
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <ScreenHeader title={t('person.newPerson')} onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <TextInput
            ref={nameRef}
            style={s.nameInput}
            value={draftName}
            onChangeText={setDraftName}
            placeholder={t('person.namePlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.namePlaceholder')}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onSave}
          />
          <DrilldownRow
            label={t('person.cadenceRow')}
            value={cadenceLabel(draftCadence)}
            placeholder={draftCadence == null}
            onPress={() => setSheet('cadence')}
          />
        </ScrollView>

        {/* Save FAB — disabled until a name is entered (name is required) */}
        <Pressable
          onPress={onSave}
          disabled={!trimmedName}
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}
          style={({ pressed }) => [s.saveFab, pressed && s.fabPressed, !trimmedName && s.saveFabDisabled]}
        >
          <Check size={20} color={c.inkButtonText} strokeWidth={2.5} />
          <Text style={s.saveFabText}>{t('common.save')}</Text>
        </Pressable>

        <CadenceSheet
          visible={sheet === 'cadence'}
          value={draftCadence}
          onClose={() => setSheet(null)}
          onPick={setDraftCadence}
        />
      </SafeAreaView>
    );
  }

  // EDIT mode below — person is guaranteed to exist past the guard above.
  if (!person) return null; // unreachable; satisfies the type narrower
  const now = Date.now();
  const displayName = person.name.trim() || t('person.newPerson');
  const since = daysSinceContact(person, now);
  const statusText =
    person.lastContactedAt == null
      ? t('person.lastReachedNever')
      : since === 0
        ? t('person.lastReachedToday')
        : t('person.lastReachedDays', { days: since });

  const kindLabel = (k: InteractionKind): string =>
    k === 'call'
      ? t('person.logKindCall')
      : k === 'text'
        ? t('person.logKindText')
        : k === 'inPerson'
          ? t('person.logKindInPerson')
          : t('person.logKindOther');

  const history = sortedInteractions(person).slice(0, 6);
  const personConversations = openConversationsForPerson(conversations, person.id);

  // Summary-row values — the hub is a receipt of what's filled in.
  const nextDate = person.importantDates
    .map((d) => ({ d, du: daysUntil(nextOccurrence(d, now), now) }))
    .sort((a, b) => a.du - b.du)[0];
  const dateValue = nextDate
    ? `${nextDate.d.label} · ${nextDate.du === 0 ? t('person.dateToday') : t('person.inDays', { days: nextDate.du })}`
    : t('person.noneYet');
  const prefsValue =
    person.preferences.length === 0
      ? t('person.noneYet')
      : person.preferences.length === 1
        ? t('person.oneSaved')
        : t('person.countSaved', { count: person.preferences.length });
  const personalityValueText =
    PERSONALITY_CATALOG.map((cat) => {
      const v = personalityValue(person, cat.framework);
      return v ? t(optionShortKey(cat.framework, v)) : null;
    })
      .filter(Boolean)
      .join(' · ') || t('person.notSet');

  const onLog = () => {
    logContact(person.id, logKind, logNote);
    setLogNote('');
  };

  const onStartConversation = () => {
    const id = createConversation(person.id, person.name);
    navigation.navigate('ConversationDetail', { conversationId: id });
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
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Name */}
        <TextInput
          style={s.nameInput}
          value={person.name}
          onChangeText={(v) => renamePerson(person.id, v)}
          placeholder={t('person.namePlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('person.namePlaceholder')}
        />

        {/* The ACTION — logging a catch-up — set apart from the information below.
            Grouped in its own card under a clear header so it reads as "do this",
            not as more facts about the person. */}
        <Text style={s.sectionLabel}>{t('person.logSectionLabel')}</Text>
        <View style={s.actionCard}>
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
            multiline
            textAlignVertical="top"
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

          {/* Recent catch-ups — history of the action, kept with it */}
          {history.length > 0 && (
            <>
              <Text style={s.historyLabel}>{t('person.historyLabel')}</Text>
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
        </View>

        {/* What you know about them — one summary row per dimension; each opens
            its own focused sheet. */}
        <Text style={s.sectionLabel}>{t('person.aboutSectionLabel')}</Text>
        <DrilldownRow
          label={t('person.cadenceRow')}
          value={cadenceLabel(person.cadenceDays)}
          placeholder={person.cadenceDays == null}
          onPress={() => setSheet('cadence')}
        />
        <DrilldownRow
          label={t('person.howWeMetLabel')}
          value={preview(person.howWeMet) || t('person.notSet')}
          placeholder={!person.howWeMet?.trim()}
          onPress={() => setSheet('howWeMet')}
        />
        <DrilldownRow
          label={t('person.notesLabel')}
          value={preview(person.notes) || t('person.notSet')}
          placeholder={!person.notes.trim()}
          onPress={() => setSheet('notes')}
        />
        <DrilldownRow
          label={t('person.datesLabel')}
          value={dateValue}
          placeholder={!nextDate}
          onPress={() => setSheet('dates')}
        />
        <DrilldownRow
          label={t('person.prefsLabel')}
          value={prefsValue}
          placeholder={person.preferences.length === 0}
          onPress={() => setSheet('prefs')}
        />
        <DrilldownRow
          label={t('person.personalityLabel')}
          value={personalityValueText}
          placeholder={personalityValueText === t('person.notSet')}
          onPress={() => setSheet('personality')}
        />

        {/* Conversations to have (Have the Conversation) */}
        <Text style={s.sectionLabel}>{t('htc.personSection')}</Text>
        {personConversations.map((conv) => (
          <Pressable
            key={conv.id}
            onPress={() => navigation.navigate('ConversationDetail', { conversationId: conv.id })}
            accessibilityRole="button"
            accessibilityLabel={conv.topic.trim() || t(flavorLabelKey(conv.flavor))}
            style={({ pressed }) => [s.listRow, pressed && s.pressed]}
          >
            <Text style={s.listRowText} numberOfLines={1}>
              {conv.topic.trim() || t(flavorLabelKey(conv.flavor))}
            </Text>
            <ChevronRight size={18} color={c.fgSubtle} strokeWidth={1.5} />
          </Pressable>
        ))}
        <Pressable
          onPress={onStartConversation}
          accessibilityRole="button"
          accessibilityLabel={t('htc.add')}
          style={({ pressed }) => [s.convBtn, pressed && s.pressed]}
        >
          <MessageCircleHeart size={18} color={c.fg} strokeWidth={1.5} />
          <Text style={s.convBtnText}>{t('htc.add')}</Text>
        </Pressable>

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

      <CadenceSheet
        visible={sheet === 'cadence'}
        value={person.cadenceDays}
        onClose={() => setSheet(null)}
        onPick={(days) => setCadence(person.id, days)}
      />
      <PersonTextSheet
        visible={sheet === 'howWeMet'}
        title={t('person.howWeMetLabel')}
        value={person.howWeMet ?? ''}
        placeholder={t('person.howWeMetPlaceholder')}
        onClose={() => setSheet(null)}
        onChange={(v) => setHowWeMet(person.id, v)}
      />
      <PersonTextSheet
        visible={sheet === 'notes'}
        title={t('person.notesLabel')}
        value={person.notes}
        placeholder={t('person.notesPlaceholder')}
        multiline
        onClose={() => setSheet(null)}
        onChange={(v) => setNotes(person.id, v)}
      />
      <DatesSheet
        visible={sheet === 'dates'}
        dates={person.importantDates}
        onClose={() => setSheet(null)}
        onAdd={(label, month, day) => addImportantDate(person.id, label, month, day)}
        onRemove={(id) => removeImportantDate(person.id, id)}
      />
      <PrefsSheet
        visible={sheet === 'prefs'}
        preferences={person.preferences}
        onClose={() => setSheet(null)}
        onAdd={(kind, text) => addPreference(person.id, kind, text)}
        onRemove={(id) => removePreference(person.id, id)}
      />
      <PersonalitySheet
        visible={sheet === 'personality'}
        person={person}
        onClose={() => setSheet(null)}
        onPick={(framework, value) => setPersonalityType(person.id, framework, value)}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    // Generous bottom padding so the last fields clear the keyboard on both OSes
    // (and so the floating Save button never sits over the final input).
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: 120 },
    nameInput: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg, paddingVertical: space.s4 },
    // The action group ("log a catch-up") — a subtle card that separates the one
    // thing you DO here from the information about the person below it.
    actionCard: {
      backgroundColor: c.bgSubtle,
      borderRadius: radius.md,
      padding: space.s4,
      marginTop: space.s2,
    },
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
    logNote: {
      marginTop: space.s3,
      minHeight: target.min * 1.6,
      paddingTop: space.s3,
      paddingBottom: space.s3,
    },
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
    // Quieter than sectionLabel — it lives INSIDE the action card, so no big
    // top gap and no uppercase shout competing with the card's own header.
    historyLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s5,
      paddingBottom: space.s2,
    },
    historyDate: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fgMuted, width: 56 },
    historyText: { ...ty.sm, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    listRowText: { ...ty.base, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    convBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      minHeight: target.min,
      paddingHorizontal: space.s4,
      marginTop: space.s3,
      borderRadius: radius.md,
      borderWidth: hairline,
      borderColor: c.hairlineStrong,
    },
    convBtnText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s8, paddingVertical: space.s3 },
    deleteText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted },
    // Floating Save (new-person mode only) — ink-button pill, bottom-right, same
    // visual language as PeopleScreen's fab but labeled.
    saveFab: {
      position: 'absolute',
      right: space.s6,
      bottom: space.s7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      height: 52,
      paddingHorizontal: space.s6,
      borderRadius: radius.pill,
      backgroundColor: c.inkButton,
    },
    saveFabText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
    saveFabDisabled: { opacity: 0.4 },
    fabPressed: { opacity: 0.85 },
  });
}

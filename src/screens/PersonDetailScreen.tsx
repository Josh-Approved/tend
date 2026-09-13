/**
 * Person detail — the hub for one person. The ACTION (log a catch-up) stays
 * front and center with its history; below it the reminder machinery (how often
 * to reach out, important dates) and then everything you *know* about them (how
 * you met, notes, likes & gifts, personality). Each is a summary row that opens
 * its own focused sheet (hub-and-spoke, canon proposal
 * home-maintenance-20260710-1), so the hub reads as a receipt instead of a wall
 * of forms. Depth still accretes a little at a time.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Alert } from 'react-native';
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
import { PersonDetailSheets, type SheetId } from '../components/PersonDetailSheets';
import { t } from '../i18n';
import { useTheme } from '../theme';
import { makeStyles } from './personDetailStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

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
            placeholderTextColor={c.fgMuted}
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
          placeholderTextColor={c.fgMuted}
          accessibilityLabel={t('person.namePlaceholder')}
        />

        {/* The ACTION — logging a catch-up — set apart from the information below.
            Grouped in its own card under a clear header so it reads as "do this",
            not as more facts about the person. */}
        <Text style={s.sectionLabel} accessibilityRole="header">{t('person.logSectionLabel')}</Text>
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
            placeholderTextColor={c.fgMuted}
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

        {/* When the app should nudge you — the reminder machinery, kept apart
            from the facts below so "About them" is only what you know. */}
        <Text style={s.sectionLabel} accessibilityRole="header">{t('person.remindersSectionLabel')}</Text>
        <DrilldownRow
          label={t('person.cadenceRow')}
          value={cadenceLabel(person.cadenceDays)}
          placeholder={person.cadenceDays == null}
          onPress={() => setSheet('cadence')}
        />
        <DrilldownRow
          label={t('person.datesLabel')}
          value={dateValue}
          placeholder={!nextDate}
          onPress={() => setSheet('dates')}
        />

        {/* What you know about them — one summary row per dimension; each opens
            its own focused sheet. */}
        <Text style={s.sectionLabel} accessibilityRole="header">{t('person.aboutSectionLabel')}</Text>
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
        <Text style={s.sectionLabel} accessibilityRole="header">{t('htc.personSection')}</Text>
        {personConversations.map((conv) => (
          <Pressable
            key={conv.id}
            onPress={() => navigation.navigate('ConversationDetail', { conversationId: conv.id })}
            accessibilityRole="button"
            accessibilityLabel={conv.topic.trim() || t(flavorLabelKey(conv.flavor))}
            style={({ pressed }) => [s.listRow, pressed && s.pressed]}
          >
            <Text style={s.listRowText} numberOfLines={2}>
              {conv.topic.trim() || t(flavorLabelKey(conv.flavor))}
            </Text>
            <ChevronRight size={18} color={c.fgMuted} strokeWidth={1.5} />
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

      <PersonDetailSheets person={person} sheet={sheet} onClose={() => setSheet(null)} />
    </SafeAreaView>
  );
}

/**
 * Conversation detail — the framework that helps you prepare for one hard, honest
 * conversation. A calm single form, not a wizard: pick who it's with and what
 * kind of conversation it is, then work through the prompts (every field
 * optional, saved as you type). The flavor tailors the prompts; the apology
 * flavor carries the full reconciliation loop. Marking it "had" is the payoff and
 * opens a short reflection.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Trash2, RotateCcw, Users } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useConversationsStore } from '../store/conversations';
import { CONVERSATION_FLAVORS, conversationDisplayName, type Conversation } from '../data/conversation';
import { PersonPicker, type PersonPickResult } from '../components/PersonPicker';
import {
  flavorDef,
  flavorLabelKey,
  promptLabelKey,
  promptPlaceholderKey,
  flavorHasNote,
  flavorNoteKey,
} from '../data/conversationFramework';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationDetail'>;

export default function ConversationDetailScreen({ route, navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { conversationId } = route.params;
  const conversation = useConversationsStore((st) => st.conversations.find((x) => x.id === conversationId));

  const setField = useConversationsStore((st) => st.setField);
  const setPerson = useConversationsStore((st) => st.setPerson);
  const setFlavor = useConversationsStore((st) => st.setFlavor);
  const setFlavorField = useConversationsStore((st) => st.setFlavorField);
  const markHad = useConversationsStore((st) => st.markHad);
  const reopen = useConversationsStore((st) => st.reopen);
  const deleteConversation = useConversationsStore((st) => st.deleteConversation);

  const [pickerVisible, setPickerVisible] = useState(false);
  // True once the user explicitly deletes, so the unmount guard doesn't also
  // try to delete (and so a deliberate delete is never second-guessed).
  const deletedRef = useRef(false);

  // Discard a brand-new, entirely empty conversation when the user leaves, so a
  // blank shell is never saved (same safeguard as the People tab). Reads the
  // latest record from the store to avoid a stale closure.
  const discardIfEmpty = useCallback(() => {
    if (deletedRef.current) return;
    const current = useConversationsStore.getState().getConversation(conversationId);
    if (current && isConversationEmpty(current)) {
      deletedRef.current = true;
      deleteConversation(conversationId);
    }
  }, [conversationId, deleteConversation]);

  // Back gesture / header back / programmatic pop all route through here.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      discardIfEmpty();
    });
    return unsub;
  }, [navigation, discardIfEmpty]);

  if (!conversation) {
    navigation.goBack();
    return null;
  }

  const isHad = conversation.status === 'had';
  const displayName = conversationDisplayName(conversation, t('htc.newConversation'));
  const def = flavorDef(conversation.flavor);

  const onDelete = () => {
    Alert.alert(t('htc.deleteConfirmTitle'), t('htc.deleteConfirmBody'), [
      { text: t('person.cancel'), style: 'cancel' },
      {
        text: t('person.confirmRemove'),
        style: 'destructive',
        onPress: () => {
          deletedRef.current = true;
          deleteConversation(conversation.id);
          navigation.goBack();
        },
      },
    ]);
  };

  // Save = commit & exit. Everything already auto-saves on each keystroke, so
  // this just dismisses the keyboard and leaves (the beforeRemove guard handles
  // discarding a blank conversation).
  const onSave = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const onPickPerson = (result: PersonPickResult) => {
    setPickerVisible(false);
    if (result.kind === 'person') {
      setPerson(conversation.id, result.id, result.name);
    }
    // 'new' keeps the current free-text name; nothing to link.
  };

  // Typing in the free-text name field unlinks any real-person link, so a stale
  // link can't linger behind a name the user has since edited by hand.
  const onChangeName = (v: string) => {
    if (conversation.personId) {
      setPerson(conversation.id, null, v);
    } else {
      setField(conversation.id, 'personName', v);
    }
  };

  const isLinked = conversation.personId != null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={displayName} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Who */}
          <Text style={s.sectionLabel}>{t('htc.whoLabel')}</Text>
          <TextInput
            style={s.input}
            value={conversation.personName}
            onChangeText={onChangeName}
            placeholder={t('htc.whoPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('htc.whoLabel')}
          />
          {isLinked ? (
            <Pressable
              onPress={() => setPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('htc.changePerson')}
              style={({ pressed }) => [s.linkRow, pressed && s.pressed]}
            >
              <Users size={16} color={c.appAccent} strokeWidth={1.75} />
              <Text style={s.linkedText} numberOfLines={1}>
                {conversation.personName.trim() || t('htc.someone')}
              </Text>
              <Text style={s.changeText}>{t('htc.changePerson')}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('htc.linkExisting')}
              style={({ pressed }) => [s.linkRow, pressed && s.pressed]}
            >
              <Users size={16} color={c.fgMuted} strokeWidth={1.5} />
              <Text style={s.linkText}>{t('htc.linkExisting')}</Text>
            </Pressable>
          )}

        {/* Flavor */}
        <Text style={s.sectionLabel}>{t('htc.flavorLabel')}</Text>
        <View style={s.chips}>
          {CONVERSATION_FLAVORS.map((f) => {
            const selected = conversation.flavor === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFlavor(conversation.id, f)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t(flavorLabelKey(f))}
                style={({ pressed }) => [s.chip, selected && s.chipOn, pressed && s.pressed]}
              >
                <Text style={[s.chipText, selected && s.chipTextOn]}>{t(flavorLabelKey(f))}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* What to share */}
        <Text style={s.sectionLabel}>{t('htc.core.topicLabel')}</Text>
        <TextInput
          style={s.notes}
          value={conversation.topic}
          onChangeText={(v) => setField(conversation.id, 'topic', v)}
          placeholder={t('htc.core.topicPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('htc.core.topicLabel')}
          multiline
          textAlignVertical="top"
        />

        {/* Flavor-tailored prompts */}
        {flavorHasNote(conversation.flavor) && (
          <View style={s.note}>
            <Text style={s.noteText}>{t(flavorNoteKey(conversation.flavor))}</Text>
          </View>
        )}
        {def.prompts.map((p) => (
          <View key={p.key}>
            <Text style={s.sectionLabel}>{t(promptLabelKey(p.key))}</Text>
            <TextInput
              style={p.multiline ? s.notes : s.input}
              value={conversation.flavorFields[p.key] ?? ''}
              onChangeText={(v) => setFlavorField(conversation.id, p.key, v)}
              placeholder={t(promptPlaceholderKey(p.key))}
              placeholderTextColor={c.fgSubtle}
              accessibilityLabel={t(promptLabelKey(p.key))}
              multiline={p.multiline}
              textAlignVertical={p.multiline ? 'top' : 'center'}
            />
          </View>
        ))}

        {/* The story I'm telling myself */}
        <Text style={s.sectionLabel}>{t('htc.core.storyLabel')}</Text>
        <TextInput
          style={s.notes}
          value={conversation.story}
          onChangeText={(v) => setField(conversation.id, 'story', v)}
          placeholder={t('htc.core.storyPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('htc.core.storyLabel')}
          multiline
          textAlignVertical="top"
        />

        {/* Impact */}
        <Text style={s.sectionLabel}>{t('htc.core.impactLabel')}</Text>
        <TextInput
          style={s.notes}
          value={conversation.impact}
          onChangeText={(v) => setField(conversation.id, 'impact', v)}
          placeholder={t('htc.core.impactPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('htc.core.impactLabel')}
          multiline
          textAlignVertical="top"
        />

        {/* Hope */}
        <Text style={s.sectionLabel}>{t('htc.core.hopeLabel')}</Text>
        <TextInput
          style={s.notes}
          value={conversation.hope}
          onChangeText={(v) => setField(conversation.id, 'hope', v)}
          placeholder={t('htc.core.hopePlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('htc.core.hopeLabel')}
          multiline
          textAlignVertical="top"
        />

        {/* Lifecycle */}
        {isHad ? (
          <>
            <View style={s.hadBanner}>
              <Check size={18} color={c.accent} strokeWidth={2.5} />
              <Text style={s.hadBannerText}>{t('htc.hadOn')}</Text>
            </View>
            <Text style={s.sectionLabel}>{t('htc.reflectionLabel')}</Text>
            <TextInput
              style={s.notes}
              value={conversation.reflection}
              onChangeText={(v) => setField(conversation.id, 'reflection', v)}
              placeholder={t('htc.reflectionPlaceholder')}
              placeholderTextColor={c.fgSubtle}
              accessibilityLabel={t('htc.reflectionLabel')}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              onPress={() => reopen(conversation.id)}
              accessibilityRole="button"
              accessibilityLabel={t('htc.reopen')}
              style={({ pressed }) => [s.reopenRow, pressed && s.pressed]}
            >
              <RotateCcw size={16} color={c.fgMuted} strokeWidth={1.5} />
              <Text style={s.reopenText}>{t('htc.reopen')}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => markHad(conversation.id)}
            accessibilityRole="button"
            accessibilityLabel={t('htc.markHad')}
            style={({ pressed }) => [s.hadBtn, pressed && s.pressed]}
          >
            <Check size={18} color={c.accent} strokeWidth={2.5} />
            <Text style={s.hadBtnText}>{t('htc.markHad')}</Text>
          </Pressable>
        )}

        {/* Delete */}
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={t('htc.deleteConversation')}
          style={({ pressed }) => [s.deleteRow, pressed && s.pressed]}
        >
          <Trash2 size={18} color={c.fgMuted} strokeWidth={1.5} />
          <Text style={s.deleteText}>{t('htc.deleteConversation')}</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel={t('common.save')}
        style={({ pressed }) => [s.saveFab, pressed && s.saveFabPressed]}
      >
        <Check size={18} color={c.inkButtonText} strokeWidth={2.5} />
        <Text style={s.saveFabText}>{t('common.save')}</Text>
      </Pressable>

      <PersonPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={onPickPerson}
      />
    </SafeAreaView>
  );
}

/** A brand-new conversation with nothing in it — safe to discard on exit. */
function isConversationEmpty(c: Conversation): boolean {
  if (c.personName.trim()) return false;
  if (c.topic.trim()) return false;
  if (c.story.trim()) return false;
  if (c.impact.trim()) return false;
  if (c.hope.trim()) return false;
  if (Object.values(c.flavorFields).some((v) => v.trim())) return false;
  return true;
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.6 },
    // Generous bottom padding so the last field scrolls clear of the keyboard
    // and content never hides behind the floating Save button.
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: 160 },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s6,
      paddingBottom: space.s3,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
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
    notes: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
      minHeight: 88,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      padding: space.s4,
    },
    note: {
      marginTop: space.s4,
      padding: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      borderLeftWidth: 3,
      borderLeftColor: c.appAccent,
    },
    noteText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fg, lineHeight: 20 },
    hadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.s2,
      minHeight: target.min,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: c.accent,
      paddingHorizontal: space.s5,
      marginTop: space.s8,
    },
    hadBtnText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.fg },
    hadBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      marginTop: space.s8,
      paddingVertical: space.s2,
    },
    hadBannerText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.fg },
    reopenRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s4, paddingVertical: space.s2 },
    reopenText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s8, paddingVertical: space.s3 },
    deleteText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      marginTop: space.s3,
      paddingVertical: space.s2,
    },
    linkText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    linkedText: { flex: 1, ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fg },
    changeText: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.appAccent },
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
      justifyContent: 'center',
    },
    saveFabPressed: { opacity: 0.85 },
    saveFabText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
  });
}

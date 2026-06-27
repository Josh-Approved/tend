/**
 * Conversation detail — the framework that helps you prepare for one hard, honest
 * conversation. A calm single form, not a wizard: pick who it's with and what
 * kind of conversation it is, then work through the prompts (every field
 * optional, saved as you type). The flavor tailors the prompts; the apology
 * flavor carries the full reconciliation loop. Marking it "had" is the payoff and
 * opens a short reflection.
 */

import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Trash2, RotateCcw } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useConversationsStore } from '../store/conversations';
import { CONVERSATION_FLAVORS, conversationDisplayName } from '../data/conversation';
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
  const setFlavor = useConversationsStore((st) => st.setFlavor);
  const setFlavorField = useConversationsStore((st) => st.setFlavorField);
  const markHad = useConversationsStore((st) => st.markHad);
  const reopen = useConversationsStore((st) => st.reopen);
  const deleteConversation = useConversationsStore((st) => st.deleteConversation);

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
          deleteConversation(conversation.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={displayName} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {/* Who */}
        <Text style={s.sectionLabel}>{t('htc.whoLabel')}</Text>
        <TextInput
          style={s.input}
          value={conversation.personName}
          onChangeText={(v) => setField(conversation.id, 'personName', v)}
          placeholder={t('htc.whoPlaceholder')}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={t('htc.whoLabel')}
        />

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
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: space.s9 },
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
  });
}

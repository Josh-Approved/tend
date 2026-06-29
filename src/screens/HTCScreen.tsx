/**
 * Have the Conversation — the third tab. Lists the hard, honest conversations you
 * mean to have ("To have") and the ones you've had ("Had", the payoff). The +
 * starts one; the info button reopens the concept intro; the gear opens Settings.
 * The first time you ever open this tab, the onboarding modal introduces the idea.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Plus, Info, Check } from 'lucide-react-native';
import type { TabScreenProps } from '../../App';
import { useConversationsStore } from '../store/conversations';
import { openConversations, hadConversations, conversationDisplayName, type Conversation } from '../data/conversation';
import { flavorLabelKey } from '../data/conversationFramework';
import { EmptyState } from '../components/EmptyState';
import { HTCIntro } from '../components/HTCIntro';
import { PersonPicker, type PersonPickResult } from '../components/PersonPicker';
import { getAppSetting, setAppSetting } from '../storage/kv';
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

const INTRO_SEEN_KEY = 'htc.introSeen';

export default function HTCScreen({ navigation }: TabScreenProps<'HTC'>) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const conversations = useConversationsStore((st) => st.conversations);
  const createConversation = useConversationsStore((st) => st.createConversation);
  const [introVisible, setIntroVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    let active = true;
    getAppSetting(INTRO_SEEN_KEY)
      .then((seen) => {
        if (active && !seen) setIntroVisible(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const dismissIntro = () => {
    setIntroVisible(false);
    setAppSetting(INTRO_SEEN_KEY, '1').catch(() => {});
  };

  const open = openConversations(conversations);
  const had = hadConversations(conversations);
  const isEmpty = open.length === 0 && had.length === 0;

  const onPick = (result: PersonPickResult) => {
    setPickerVisible(false);
    const id =
      result.kind === 'person'
        ? createConversation(result.id, result.name)
        : createConversation();
    navigation.navigate('ConversationDetail', { conversationId: id });
  };

  const renderRow = (item: Conversation, muted: boolean) => {
    const name = conversationDisplayName(item, t('htc.someone'));
    const secondary = item.topic.trim() || t(flavorLabelKey(item.flavor));
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [s.row, pressed && s.pressed]}
        onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        <View style={s.rowMain}>
          <Text style={[s.rowTitle, muted && s.rowTitleMuted]}>{name}</Text>
          <Text style={s.rowSub} numberOfLines={1}>
            {secondary}
          </Text>
        </View>
        {muted && <Check size={18} color={c.accent} strokeWidth={2} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>{t('htc.title')}</Text>
        <View style={s.headerActions}>
          <Pressable
            onPress={() => setIntroVisible(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('htc.whatIsThis')}
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
          >
            <Info size={22} color={c.fg} strokeWidth={1.5} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('settings.title')}
            style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
          >
            <SettingsIcon size={22} color={c.fg} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {isEmpty ? (
        <View style={s.emptyWrap}>
          <EmptyState message={t('htc.empty')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {open.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t('htc.toHave')}</Text>
              {open.map((item) => renderRow(item, false))}
            </>
          )}
          {had.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t('htc.had')}</Text>
              {had.map((item) => renderRow(item, true))}
            </>
          )}
        </ScrollView>
      )}

      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('htc.add')}
      >
        <Plus size={24} color={c.inkButtonText} strokeWidth={2} />
      </Pressable>

      <PersonPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onSelect={onPick} />
      <HTCIntro visible={introVisible} onClose={dismissIntro} />
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    header: {
      ...boundedContent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.s5,
      paddingVertical: space.s4,
    },
    title: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min + 14,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    rowMain: { flex: 1, paddingVertical: space.s3, gap: 2 },
    rowTitle: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    rowTitleMuted: { color: c.fgMuted },
    rowSub: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s6 },
    fab: {
      position: 'absolute',
      right: space.s6,
      bottom: space.s7,
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: c.inkButton,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabPressed: { opacity: 0.85 },
  });
}

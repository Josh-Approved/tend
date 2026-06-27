/**
 * Me — the fourth tab: a personal user manual you author about yourself, the
 * mirror to the notes you keep about others. A calm, optional set of prompts
 * (fill what resonates, over time); "Share my manual" composes the filled prompts
 * into readable text and hands it to the native share sheet — you choose who, and
 * the OS does the sending. Nothing leaves the device until you send it.
 */

import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Share2 } from 'lucide-react-native';
import type { TabScreenProps } from '../../App';
import { useMeStore } from '../store/me';
import { ME_PROMPTS, meIsEmpty, composeManualText, mePromptLabelKey, mePromptPlaceholderKey } from '../data/me';
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

export default function MeScreen({ navigation }: TabScreenProps<'Me'>) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const profile = useMeStore((st) => st.profile);
  const setField = useMeStore((st) => st.setField);

  const empty = meIsEmpty(profile);

  const onShare = () => {
    const text = composeManualText(profile, (k) => t(mePromptLabelKey(k)), t('me.shareHeading'));
    Share.share({ message: text }).catch(() => {});
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>{t('me.title')}</Text>
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

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={s.intro}>{t('me.intro')}</Text>

        {ME_PROMPTS.map((p) => (
          <View key={p.key}>
            <Text style={s.sectionLabel}>{t(mePromptLabelKey(p.key))}</Text>
            <TextInput
              style={s.notes}
              value={profile[p.key] ?? ''}
              onChangeText={(v) => setField(p.key, v)}
              placeholder={t(mePromptPlaceholderKey(p.key))}
              placeholderTextColor={c.fgSubtle}
              accessibilityLabel={t(mePromptLabelKey(p.key))}
              multiline
              textAlignVertical="top"
            />
          </View>
        ))}

        <Pressable
          onPress={onShare}
          disabled={empty}
          accessibilityRole="button"
          accessibilityLabel={t('me.share')}
          style={({ pressed }) => [s.shareBtn, pressed && s.pressed, empty && s.shareBtnDisabled]}
        >
          <Share2 size={18} color={c.fg} strokeWidth={1.5} />
          <Text style={s.shareText}>{t('me.share')}</Text>
        </Pressable>
      </ScrollView>
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
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    content: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: space.s9 },
    intro: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, lineHeight: 20, paddingTop: space.s2, paddingBottom: space.s2 },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s6,
      paddingBottom: space.s3,
    },
    notes: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
      minHeight: 72,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      padding: space.s4,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.s2,
      minHeight: target.min,
      paddingHorizontal: space.s5,
      marginTop: space.s8,
      borderRadius: radius.md,
      borderWidth: hairline,
      borderColor: c.hairlineStrong,
    },
    shareBtnDisabled: { opacity: 0.4 },
    shareText: { ...ty.base, fontFamily: fontFamily.sansMedium, color: c.fg },
  });
}

/**
 * First-visit onboarding for Have the Conversation. HTC asks something unusual of
 * a utility app — to name a hard, unspoken thing — so the concept gets a calm,
 * plain-language introduction the first time you open the tab. Dismissible, and
 * re-openable from the "What is this?" link in the header.
 *
 * App-owned. Full-screen <Modal> carries its own <SafeAreaProvider> so safe-area
 * insets resolve inside the modal layer (rn/modal-safe-area-provider).
 */

import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircleHeart } from 'lucide-react-native';
import { t } from '../i18n';
import { useTheme, fontFamily, space, target, type as ty, radius, type Colors } from '../theme';

export function HTCIntro({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  const s = makeStyles(c);
  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
          <ScrollView contentContainerStyle={s.content}>
            <View style={s.glyph}>
              <MessageCircleHeart size={28} color={c.appAccent} strokeWidth={1.5} />
            </View>
            <Text style={s.title}>{t('htc.introTitle')}</Text>
            <Text style={s.body}>{t('htc.introBody1')}</Text>
            <Text style={s.body}>{t('htc.introBody2')}</Text>
            <Text style={s.body}>{t('htc.introBody3')}</Text>
            <Text style={s.privacy}>{t('htc.introPrivacy')}</Text>
          </ScrollView>
          <View style={s.footer}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('htc.introDismiss')}
              style={({ pressed }) => [s.btn, pressed && s.pressed]}
            >
              <Text style={s.btnText}>{t('htc.introDismiss')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { paddingHorizontal: space.s6, paddingTop: space.s8, paddingBottom: space.s6, gap: space.s4 },
    glyph: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: c.appAccentBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.s2,
    },
    title: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg },
    body: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg, lineHeight: 24 },
    privacy: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingTop: space.s3 },
    footer: { paddingHorizontal: space.s6, paddingBottom: space.s5, paddingTop: space.s3 },
    btn: {
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.inkButton,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.s5,
    },
    btnText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
    pressed: { opacity: 0.85 },
  });
}

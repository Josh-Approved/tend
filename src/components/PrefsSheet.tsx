/**
 * Likes / dislikes / gift ideas spoke: the preference list with its kind
 * picker and add row, off the hub. The kind chips are fine inline HERE —
 * three options, one row, and they're this sheet's single question.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { type Preference, type PreferenceKind } from '../data/person';
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

const PREF_KINDS: PreferenceKind[] = ['like', 'dislike', 'gift'];

type Props = {
  visible: boolean;
  preferences: Preference[];
  onClose: () => void;
  onAdd: (kind: PreferenceKind, text: string) => void;
  onRemove: (id: string) => void;
};

export function PrefsSheet({ visible, preferences, onClose, onAdd, onRemove }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const [kind, setKind] = useState<PreferenceKind>('like');
  const [text, setText] = useState('');
  const kindLabel = (k: PreferenceKind) => t(`person.${k}`);

  const add = () => {
    if (!text.trim()) return;
    onAdd(kind, text);
    setText('');
  };

  return (
    <DrilldownSheet visible={visible} title={t('person.prefsLabel')} onClose={onClose}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {preferences.map((pref) => (
          <View key={pref.id} style={s.listRow}>
            <Text style={s.prefTag}>{kindLabel(pref.kind)}</Text>
            <Text style={s.listRowText}>{pref.text}</Text>
            <Pressable
              onPress={() => onRemove(pref.id)}
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
          {PREF_KINDS.map((k) => {
            const selected = kind === k;
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
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
        <View style={s.addRow}>
          <TextInput
            style={[s.input, s.flex1]}
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            placeholder={t('person.prefPlaceholder')}
            placeholderTextColor={c.fgSubtle}
            accessibilityLabel={t('person.prefPlaceholder')}
            returnKeyType="done"
          />
          <Pressable
            onPress={add}
            disabled={!text.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('person.addPref')}
            style={({ pressed }) => [s.addBtn, pressed && s.pressed, !text.trim() && s.disabled]}
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
    disabled: { opacity: 0.4 },
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
    prefTag: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.appAccent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2, marginTop: space.s5 },
    chip: {
      minHeight: target.min,
      justifyContent: 'center',
      paddingHorizontal: space.s4,
      borderRadius: radius.pill,
      backgroundColor: c.bgSubtle,
      borderWidth: hairline,
      borderColor: c.hairline,
    },
    chipOn: { backgroundColor: c.fg, borderColor: c.fg },
    chipText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fg },
    chipTextOn: { color: c.bg, fontFamily: fontFamily.sansSemibold },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: space.s2, marginTop: space.s3 },
    input: {
      minHeight: target.min,
      paddingHorizontal: space.s4,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
    },
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

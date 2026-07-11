/**
 * One-field text spoke: a focused editor for a single prose field about a
 * person (how you met, notes). Writes through live like the rest of the
 * person screen — Back is done; there is nothing to confirm.
 */

import React from 'react';
import { TextInput, ScrollView, StyleSheet } from 'react-native';
import { DrilldownSheet } from './DrilldownSheet';
import {
  useTheme,
  fontFamily,
  space,
  target,
  type as ty,
  radius,
  boundedContent,
  type Colors,
} from '../theme';

type Props = {
  visible: boolean;
  title: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onClose: () => void;
  onChange: (value: string) => void;
};

export function PersonTextSheet({
  visible,
  title,
  value,
  placeholder,
  multiline,
  onClose,
  onChange,
}: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  return (
    <DrilldownSheet visible={visible} title={title} onClose={onClose}>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[s.input, multiline && s.multiline]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={c.fgSubtle}
          accessibilityLabel={title}
          autoFocus
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          returnKeyType={multiline ? 'default' : 'done'}
        />
      </ScrollView>
    </DrilldownSheet>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    body: { ...boundedContent, paddingHorizontal: space.s6, paddingTop: space.s4 },
    input: {
      minHeight: target.min,
      paddingHorizontal: space.s4,
      paddingVertical: space.s3,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fg,
    },
    multiline: { minHeight: 160 },
  });
}

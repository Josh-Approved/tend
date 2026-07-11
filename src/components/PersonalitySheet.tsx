/**
 * Personality spoke: the full catalog — five frameworks of chips plus the
 * "how to show up" guidance cards — in its own focused screen instead of
 * dominating the person hub. Live writes; tapping a selected chip clears it.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { personalityValue, type Person, type PersonalityFramework } from '../data/person';
import {
  PERSONALITY_CATALOG,
  frameworkLabelKey,
  optionShortKey,
  optionLabelKey,
  optionRelateKey,
} from '../data/personality';
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

type Props = {
  visible: boolean;
  person: Person;
  onClose: () => void;
  onPick: (framework: PersonalityFramework, value: string | null) => void;
};

export function PersonalitySheet({ visible, person, onClose, onPick }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  return (
    <DrilldownSheet visible={visible} title={t('person.personalityLabel')} onClose={onClose}>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.hint}>{t('person.personalityHint')}</Text>
        {PERSONALITY_CATALOG.map((cat) => {
          const selected = personalityValue(person, cat.framework);
          return (
            <View key={cat.framework} style={s.block}>
              <Text style={s.subLabel}>{t(frameworkLabelKey(cat.framework))}</Text>
              <View style={s.chips}>
                {cat.values.map((v) => {
                  const on = selected === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => onPick(cat.framework, on ? null : v)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={t(optionLabelKey(cat.framework, v))}
                      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && s.pressed]}
                    >
                      <Text style={[s.chipText, on && s.chipTextOn]}>
                        {t(optionShortKey(cat.framework, v))}
                      </Text>
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
      </ScrollView>
    </DrilldownSheet>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    pressed: { opacity: 0.6 },
    body: { ...boundedContent, paddingHorizontal: space.s6, paddingBottom: space.s9 },
    hint: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingTop: space.s3 },
    block: { marginTop: space.s5 },
    subLabel: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.fg, paddingBottom: space.s2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s2 },
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
  });
}

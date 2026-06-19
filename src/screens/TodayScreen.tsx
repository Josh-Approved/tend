/**
 * Today — the default tab and triage surface. Shows ONLY what needs you now:
 * people who are overdue or due soon (with one-tap reach-out) and dates coming up
 * in the next two weeks. Stays short no matter how many people you track; when
 * there's nothing, it says so plainly.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Check } from 'lucide-react-native';
import type { TabScreenProps } from '../../App';
import { usePeopleStore } from '../store/people';
import { actionablePeople, dueStatus, upcomingDates, type Person } from '../data/person';
import { FundingFooter } from '../components/FundingFooter';
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

function reachSubline(person: Person, now: number): string {
  const s = dueStatus(person, now);
  if (s.state === 'overdue') {
    const over = -(s.daysUntilDue ?? 0);
    return over <= 0 ? t('home.dueToday') : t('home.overdueBy', { days: over });
  }
  return t('home.dueInDays', { days: s.daysUntilDue ?? 0 });
}

export default function TodayScreen({ navigation }: TabScreenProps<'Today'>) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const people = usePeopleStore((st) => st.people);
  const logContact = usePeopleStore((st) => st.logContact);
  const now = Date.now();
  const actionable = actionablePeople(people, now);
  const upcoming = upcomingDates(people, now, 14);
  const nothing = actionable.length === 0 && upcoming.length === 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>{t('today.title')}</Text>
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

      {nothing ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>{t('today.caughtUp')}</Text>
          <Text style={s.emptySub}>{t('today.caughtUpSub')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {actionable.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t('today.reachOut')}</Text>
              {actionable.map((person) => {
                const displayName = person.name.trim() || t('person.newPerson');
                return (
                  <View key={person.id} style={s.row}>
                    <Pressable
                      style={({ pressed }) => [s.rowMain, pressed && s.pressed]}
                      onPress={() => navigation.navigate('PersonDetail', { personId: person.id })}
                      accessibilityRole="button"
                      accessibilityLabel={displayName}
                    >
                      <Text style={s.rowTitle}>{displayName}</Text>
                      <Text style={s.rowSub}>{reachSubline(person, now)}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => logContact(person.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.markReached', { name: displayName })}
                      style={({ pressed }) => [s.reachBtn, pressed && s.pressed]}
                    >
                      <Check size={18} color={c.accent} strokeWidth={2} />
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t('home.comingUp')}</Text>
              {upcoming.map((u) => {
                const name = u.person.name.trim() || t('person.newPerson');
                return (
                  <Pressable
                    key={`${u.person.id}-${u.date.id}`}
                    onPress={() => navigation.navigate('PersonDetail', { personId: u.person.id })}
                    accessibilityRole="button"
                    style={({ pressed }) => [s.comingRow, pressed && s.pressed]}
                  >
                    <Text style={s.comingText}>
                      {u.days === 0
                        ? t('home.comingUpToday', { name, label: u.date.label })
                        : t('home.comingUpDays', { name, label: u.date.label, days: u.days })}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      <FundingFooter />
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
    rowSub: { ...ty.sm, fontFamily: fontFamily.sansSemibold, color: c.appAccent },
    reachBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comingRow: { paddingVertical: space.s2 },
    comingText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.appAccent },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s7, gap: space.s2 },
    emptyTitle: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg, textAlign: 'center' },
    emptySub: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, textAlign: 'center' },
  });
}

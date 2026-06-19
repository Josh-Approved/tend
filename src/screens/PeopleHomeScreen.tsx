/**
 * Home — the people you're keeping up with, most-due first, with a "Coming up"
 * strip for nearby birthdays/anniversaries. The hook lives here: who should I
 * reach out to? Tap a row to open them; tap the round check to log a quick
 * "reached out"; the + adds someone; the gear opens Settings.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Plus, Check, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { usePeopleStore } from '../store/people';
import { sortByUrgency, dueStatus, upcomingDates, type Person } from '../data/person';
import { importFromContacts } from '../lib/contacts';
import { EmptyState } from '../components/EmptyState';
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

type Props = NativeStackScreenProps<RootStackParamList, 'People'>;

function subline(person: Person, now: number): { text: string; urgent: boolean } {
  const s = dueStatus(person, now);
  switch (s.state) {
    case 'overdue': {
      const over = -(s.daysUntilDue ?? 0);
      return { text: over <= 0 ? t('home.dueToday') : t('home.overdueBy', { days: over }), urgent: true };
    }
    case 'soon':
      return { text: t('home.dueInDays', { days: s.daysUntilDue ?? 0 }), urgent: true };
    case 'ok':
      return { text: t('home.okInDays', { days: s.daysUntilDue ?? 0 }), urgent: false };
    default:
      return { text: t('home.noReminder'), urgent: false };
  }
}

export default function PeopleHomeScreen({ navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const people = usePeopleStore((st) => st.people);
  const createPerson = usePeopleStore((st) => st.createPerson);
  const logContact = usePeopleStore((st) => st.logContact);
  const importPeople = usePeopleStore((st) => st.importPeople);
  const [status, setStatus] = useState<string | null>(null);

  const now = Date.now();
  const ordered = sortByUrgency(people, now);
  const upcoming = upcomingDates(people, now);

  const onAdd = () => {
    const id = createPerson();
    navigation.navigate('PersonDetail', { personId: id });
  };

  const onImport = async () => {
    const res = await importFromContacts();
    if (res && 'denied' in res) {
      setStatus(t('data.importDenied'));
      return;
    }
    const n = res && 'people' in res ? importPeople(res.people) : 0;
    setStatus(n > 0 ? t('data.imported', { count: n }) : t('data.importNone'));
  };

  const header =
    upcoming.length > 0 ? (
      <View style={s.comingUp}>
        <Text style={s.sectionLabel}>{t('home.comingUp')}</Text>
        {upcoming.map((u) => (
          <Pressable
            key={`${u.person.id}-${u.date.id}`}
            onPress={() => navigation.navigate('PersonDetail', { personId: u.person.id })}
            accessibilityRole="button"
            style={({ pressed }) => [s.comingRow, pressed && s.pressed]}
          >
            <Text style={s.comingText}>
              {u.days === 0
                ? t('home.comingUpToday', { name: u.person.name.trim() || t('person.newPerson'), label: u.date.label })
                : t('home.comingUpDays', {
                    name: u.person.name.trim() || t('person.newPerson'),
                    label: u.date.label,
                    days: u.days,
                  })}
            </Text>
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.headerBar}>
        <Text style={s.title}>{t('home.title')}</Text>
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

      {ordered.length === 0 ? (
        <View style={s.emptyWrap}>
          <EmptyState message={t('home.empty')} />
          <Pressable
            onPress={onImport}
            accessibilityRole="button"
            accessibilityLabel={t('home.importContacts')}
            style={({ pressed }) => [s.importBtn, pressed && s.pressed]}
          >
            <UserPlus size={18} color={c.fg} strokeWidth={1.5} />
            <Text style={s.importText}>{t('home.importContacts')}</Text>
          </Pressable>
          {status ? <Text style={s.status}>{status}</Text> : null}
        </View>
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={header}
          contentContainerStyle={s.listContent}
          renderItem={({ item: person }) => {
            const sub = subline(person, now);
            const displayName = person.name.trim() || t('person.newPerson');
            return (
              <View style={s.row}>
                <Pressable
                  style={({ pressed }) => [s.rowMain, pressed && s.pressed]}
                  onPress={() => navigation.navigate('PersonDetail', { personId: person.id })}
                  accessibilityRole="button"
                  accessibilityLabel={displayName}
                >
                  <Text style={s.rowTitle}>{displayName}</Text>
                  <Text style={[s.rowSub, sub.urgent && s.rowSubUrgent]}>{sub.text}</Text>
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
          }}
        />
      )}

      <FundingFooter />

      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={t('home.add')}
      >
        <Plus size={24} color={c.inkButtonText} strokeWidth={2} />
      </Pressable>
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    headerBar: {
      ...boundedContent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.s5,
      paddingVertical: space.s4,
    },
    title: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg },
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    listContent: { ...boundedContent, paddingBottom: space.s9 },
    comingUp: { paddingHorizontal: space.s5, paddingBottom: space.s4 },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingBottom: space.s2,
    },
    comingRow: { paddingVertical: space.s2 },
    comingText: { ...ty.sm, fontFamily: fontFamily.sans, color: c.appAccent },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min + 14,
      paddingLeft: space.s5,
      paddingRight: space.s4,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    rowMain: { flex: 1, paddingVertical: space.s3, gap: 2 },
    rowTitle: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    rowSub: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    rowSubUrgent: { color: c.appAccent, fontFamily: fontFamily.sansSemibold },
    reachBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.s6, gap: space.s5 },
    importBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      minHeight: target.min,
      paddingHorizontal: space.s5,
      borderRadius: radius.md,
      borderWidth: hairline,
      borderColor: c.hairlineStrong,
    },
    importText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    status: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    fab: {
      position: 'absolute',
      right: space.s6,
      bottom: space.s8,
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

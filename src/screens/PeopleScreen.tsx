/**
 * People — the full directory tab. Everyone you're tracking, A→Z, each with their
 * due status and the date you last checked in; tap to manage info + reminders.
 * The directory is a REFERENCE surface, so the rows carry no action button (an
 * ambiguous bare check used to sit here) — acting on a nudge belongs on Today.
 * The + adds someone (and opens them); the gear opens Settings; the empty state
 * offers a contacts import.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, Plus, UserPlus, Search, X } from 'lucide-react-native';
import type { TabScreenProps } from '../../App';
import { usePeopleStore } from '../store/people';
import { peopleByName, searchPeople, dueStatus, type Person } from '../data/person';
import { ContactPicker } from '../components/ContactPicker';
import { EmptyState } from '../components/EmptyState';
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

/** Below this many people, a directory is short enough to skim — no search box. */
const SEARCH_THRESHOLD = 8;

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

export default function PeopleScreen({ navigation }: TabScreenProps<'People'>) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const people = usePeopleStore((st) => st.people);
  const importPeople = usePeopleStore((st) => st.importPeople);
  const [status, setStatus] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const now = Date.now();
  const directory = peopleByName(people);
  const showSearch = directory.length >= SEARCH_THRESHOLD;
  const visible = showSearch ? searchPeople(people, query) : directory;

  // Draft-based new person: navigate WITHOUT creating, so backing straight out
  // of a blank screen persists nothing. The record is created on Save.
  const onAdd = () => {
    navigation.navigate('PersonDetail', {});
  };

  const openPicker = () => {
    setStatus(null);
    setPickerOpen(true);
  };

  // The picker hands back the people the user chose; the store dedupes again and
  // returns the count actually added so the status line can speak the truth.
  const onPicked = (chosen: Person[]) => {
    const n = importPeople(chosen);
    setStatus(n === 0 ? t('data.importNone') : t('data.imported', { count: n }));
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title} accessibilityRole="header">{t('home.title')}</Text>
        {/* Gear only. A second "add" icon lived here for a while and read as a
            rival + next to the FAB — one add affordance per surface. Adding more
            people from contacts lives in the empty state and in Settings. */}
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

      {directory.length === 0 ? (
        <View style={s.emptyWrap}>
          <EmptyState message={t('home.empty')} />
          <Pressable
            onPress={openPicker}
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
          data={visible}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            showSearch ? (
              <View style={s.searchRow}>
                <Search size={18} color={c.fgMuted} strokeWidth={1.5} />
                <TextInput
                  style={s.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t('home.searchPlaceholder')}
                  placeholderTextColor={c.fgMuted}
                  accessibilityLabel={t('home.searchPlaceholder')}
                  autoCorrect={false}
                  returnKeyType="search"
                  clearButtonMode="never"
                />
                {query.length > 0 && (
                  <Pressable
                    onPress={() => setQuery('')}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('person.cancel')}
                    style={({ pressed }) => [s.searchClear, pressed && s.pressed]}
                  >
                    <X size={16} color={c.fgMuted} strokeWidth={1.5} />
                  </Pressable>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            query.trim() ? <Text style={s.noResults}>{t('home.searchNoResults', { query: query.trim() })}</Text> : null
          }
          renderItem={({ item: person }) => {
            const sub = subline(person, now);
            const displayName = person.name.trim() || t('person.newPerson');
            // Read straight off lastContactedAt — daysSinceContact falls back to
            // createdAt, which would read as a check-in that never happened.
            const lastCheckIn =
              person.lastContactedAt == null
                ? t('home.lastCheckInNever')
                : new Date(person.lastContactedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
            return (
              <Pressable
                style={({ pressed }) => [s.row, pressed && s.pressed]}
                onPress={() => navigation.navigate('PersonDetail', { personId: person.id })}
                accessibilityRole="button"
                accessibilityLabel={`${displayName}, ${sub.text}, ${t('home.lastCheckInLabel')}: ${lastCheckIn}`}
              >
                <View style={s.rowMain}>
                  <Text style={s.rowTitle}>{displayName}</Text>
                  <Text style={[s.rowSub, sub.urgent && s.rowSubUrgent]}>{sub.text}</Text>
                </View>
                {/* Quiet receipt, not a control — the ambiguous green check is
                    gone; Today is where you act. */}
                <View style={s.lastCheckIn} importantForAccessibility="no-hide-descendants">
                  <Text style={s.lastCheckInLabel}>{t('home.lastCheckInLabel')}</Text>
                  <Text style={s.lastCheckInValue}>{lastCheckIn}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={t('home.add')}
      >
        <Plus size={24} color={c.inkButtonText} strokeWidth={2} />
      </Pressable>

      <ContactPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={onPicked} />
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
    listContent: { ...boundedContent, paddingBottom: space.s9 },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      marginHorizontal: space.s5,
      marginBottom: space.s3,
      paddingHorizontal: space.s4,
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
    },
    searchInput: { flex: 1, ...ty.base, fontFamily: fontFamily.sans, color: c.fg, paddingVertical: space.s2 },
    searchClear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    noResults: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      textAlign: 'center',
      paddingHorizontal: space.s5,
      paddingTop: space.s6,
    },
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
    lastCheckIn: { alignItems: 'flex-end', gap: 2 },
    lastCheckInLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      textAlign: 'right',
    },
    lastCheckInValue: {
      ...ty.sm,
      fontFamily: fontFamily.sansSemibold,
      color: c.fg,
      textAlign: 'right',
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

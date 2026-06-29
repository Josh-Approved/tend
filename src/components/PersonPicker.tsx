/**
 * PersonPicker — choose who a conversation is with: start fresh ("Someone new")
 * or link an existing person you already track. Linking is what gives a
 * conversation a home on that person's page (and a history). Used by the HTC tab
 * (the + flow) and the conversation detail's "Who" section.
 *
 * App-owned. Full-screen <Modal> carries its own <SafeAreaProvider> so safe-area
 * insets resolve inside the modal layer (rn/modal-safe-area-provider).
 * Cross-platform: a plain <Modal> (never ActionSheetIOS) so it works on Android.
 */

import React, { useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, FlatList, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, UserPlus, ChevronRight } from 'lucide-react-native';
import { usePeopleStore } from '../store/people';
import { peopleByName, searchPeople, type Person } from '../data/person';
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

/** Below this many people, the list is short enough to skim — no search box. */
const SEARCH_THRESHOLD = 8;

export type PersonPickResult = { kind: 'new' } | { kind: 'person'; id: string; name: string };

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: PersonPickResult) => void;
}

export function PersonPicker({ visible, onClose, onSelect }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const people = usePeopleStore((st) => st.people);
  const [query, setQuery] = useState('');

  const directory = peopleByName(people);
  const showSearch = directory.length >= SEARCH_THRESHOLD;
  const visiblePeople = showSearch ? searchPeople(people, query) : directory;

  // Reset the query each time the picker closes so it opens clean next time.
  const close = () => {
    setQuery('');
    onClose();
  };

  const choose = (result: PersonPickResult) => {
    setQuery('');
    onSelect(result);
  };

  const renderPerson = ({ item: person }: { item: Person }) => {
    const name = person.name.trim() || t('person.newPerson');
    return (
      <Pressable
        style={({ pressed }) => [s.row, pressed && s.pressed]}
        onPress={() => choose({ kind: 'person', id: person.id, name })}
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        <Text style={s.rowTitle} numberOfLines={1}>
          {name}
        </Text>
        <ChevronRight size={18} color={c.fgSubtle} strokeWidth={1.5} />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.header}>
            <Text style={s.title}>{t('htc.pickPersonTitle')}</Text>
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
            >
              <X size={22} color={c.fg} strokeWidth={1.5} />
            </Pressable>
          </View>

          <FlatList
            data={visiblePeople}
            keyExtractor={(p) => p.id}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={renderPerson}
            ListHeaderComponent={
              <View>
                {/* Someone new — always first. */}
                <Pressable
                  style={({ pressed }) => [s.newRow, pressed && s.pressed]}
                  onPress={() => choose({ kind: 'new' })}
                  accessibilityRole="button"
                  accessibilityLabel={t('htc.someoneNew')}
                >
                  <View style={s.newGlyph}>
                    <UserPlus size={18} color={c.appAccent} strokeWidth={1.75} />
                  </View>
                  <Text style={s.newText}>{t('htc.someoneNew')}</Text>
                </Pressable>

                {directory.length === 0 ? (
                  <Text style={s.emptyText}>{t('htc.noPeopleYet')}</Text>
                ) : (
                  <>
                    <Text style={s.sectionLabel}>{t('htc.chooseExisting')}</Text>
                    {showSearch && (
                      <View style={s.searchRow}>
                        <Search size={18} color={c.fgMuted} strokeWidth={1.5} />
                        <TextInput
                          style={s.searchInput}
                          value={query}
                          onChangeText={setQuery}
                          placeholder={t('home.searchPlaceholder')}
                          placeholderTextColor={c.fgSubtle}
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
                            accessibilityLabel={t('common.cancel')}
                            style={({ pressed }) => [s.searchClear, pressed && s.pressed]}
                          >
                            <X size={16} color={c.fgMuted} strokeWidth={1.5} />
                          </Pressable>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            }
            ListEmptyComponent={
              directory.length > 0 && query.trim() ? (
                <Text style={s.noResults}>{t('home.searchNoResults', { query: query.trim() })}</Text>
              ) : null
            }
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
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
    title: { ...ty.md, fontFamily: fontFamily.sansSemibold, color: c.fg, flex: 1 },
    iconBtn: { width: target.min, height: target.min, alignItems: 'center', justifyContent: 'center' },
    listContent: { ...boundedContent, paddingHorizontal: space.s5, paddingBottom: space.s9 },
    newRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min + 8,
      paddingVertical: space.s3,
    },
    newGlyph: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: c.appAccentBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.fg },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingTop: space.s6,
      paddingBottom: space.s3,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s2,
      marginBottom: space.s3,
      paddingHorizontal: space.s4,
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.bgSubtle,
    },
    searchInput: { flex: 1, ...ty.base, fontFamily: fontFamily.sans, color: c.fg, paddingVertical: space.s2 },
    searchClear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      minHeight: target.min + 6,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    rowTitle: { flex: 1, ...ty.base, fontFamily: fontFamily.sans, color: c.fg, paddingVertical: space.s3 },
    emptyText: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      paddingTop: space.s6,
      lineHeight: 24,
    },
    noResults: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      textAlign: 'center',
      paddingTop: space.s6,
    },
  });
}

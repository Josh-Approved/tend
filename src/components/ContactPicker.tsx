/**
 * ContactPicker — the guided "add from contacts" flow. Instead of dumping the
 * whole address book onto the People tab, this lets the user PICK the few people
 * they actually want to keep up with (most start with two or three; they can
 * open this again anytime to add more). Reading the address book fresh on every
 * open means a contact added on the phone later just shows up here next time.
 *
 * App-owned. Full-screen <Modal> carries its own <SafeAreaProvider> so safe-area
 * insets resolve inside the modal layer (rn/modal-safe-area-provider).
 * Cross-platform: a plain <Modal> (never ActionSheetIOS) so it works on Android.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, TextInput, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { X, Search, Check } from 'lucide-react-native';
import { usePeopleStore } from '../store/people';
import { peopleByName, type Person } from '../data/person';
import {
  fetchContactsForPicker,
  contactsToPeople,
  type PickableContact,
  type ContactFetchResult,
} from '../lib/contacts';
import { useReducedMotion } from './Dialogs';
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

/** Below this many contacts, the list is short enough to skim — no search box. */
const SEARCH_THRESHOLD = 8;

type LoadState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error' }
  | { phase: 'ready'; contacts: PickableContact[]; limited: boolean };

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the freshly-mapped Person records the user chose to add. */
  onAdd: (people: Person[]) => void;
}

export function ContactPicker({ visible, onClose, onAdd }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const reduceMotion = useReducedMotion();
  const people = usePeopleStore((st) => st.people);

  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  // Names we already track — so contacts already in the app read as "Added" and
  // can't be picked again (case-insensitive, matches the store's own dedup).
  const trackedNames = useMemo(
    () => new Set(peopleByName(people).map((p) => p.name.trim().toLowerCase())),
    [people]
  );

  // Read the address book fresh every time the picker opens. Reset selection +
  // query so it opens clean. No cached snapshot: a contact added since last time
  // appears here now.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoad({ phase: 'loading' });
    setSelected(new Set());
    setQuery('');
    fetchContactsForPicker().then((res: ContactFetchResult) => {
      if (!alive) return;
      if ('denied' in res) setLoad({ phase: 'denied' });
      else if ('error' in res) setLoad({ phase: 'error' });
      else setLoad({ phase: 'ready', contacts: res.contacts, limited: res.limited });
    });
    return () => {
      alive = false;
    };
  }, [visible]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const commit = () => {
    if (load.phase !== 'ready' || selected.size === 0) return;
    const chosen = load.contacts.filter((ct) => selected.has(ct.id));
    onAdd(contactsToPeople(chosen.map((ct) => ct.raw)));
    close();
  };

  const allContacts = load.phase === 'ready' ? load.contacts : [];
  const showSearch = allContacts.length >= SEARCH_THRESHOLD;
  const q = query.trim().toLowerCase();
  const visibleContacts = q ? allContacts.filter((ct) => ct.name.toLowerCase().includes(q)) : allContacts;

  const renderContact = ({ item }: { item: PickableContact }) => {
    const added = trackedNames.has(item.name.trim().toLowerCase());
    const isSelected = selected.has(item.id);
    if (added) {
      return (
        <View style={[s.row, s.rowDisabled]} accessible accessibilityLabel={`${item.name}, ${t('contactPicker.added')}`}>
          <View style={[s.checkbox, s.checkboxAdded]}>
            <Check size={14} color={c.fgMuted} strokeWidth={2.5} />
          </View>
          <Text style={[s.rowTitle, s.rowTitleAdded]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={s.addedTag}>{t('contactPicker.added')}</Text>
        </View>
      );
    }
    return (
      <Pressable
        style={({ pressed }) => [s.row, pressed && s.pressed]}
        onPress={() => toggle(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={item.name}
      >
        <View style={[s.checkbox, isSelected && s.checkboxOn]}>
          {isSelected && <Check size={14} color={c.inkButtonText} strokeWidth={3} />}
        </View>
        <Text style={s.rowTitle} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  const body = () => {
    switch (load.phase) {
      case 'loading':
        return (
          <View style={s.centered}>
            <ActivityIndicator color={c.fgMuted} />
            <Text style={s.centeredText}>{t('contactPicker.loading')}</Text>
          </View>
        );
      case 'denied':
        return (
          <View style={s.centered}>
            <Text style={s.centeredText}>{t('data.importDenied')}</Text>
          </View>
        );
      case 'error':
        return (
          <View style={s.centered}>
            <Text style={s.centeredText}>{t('data.importError')}</Text>
          </View>
        );
      case 'ready': {
        if (allContacts.length === 0) {
          return (
            <View style={s.centered}>
              <Text style={s.centeredText}>{t('contactPicker.noContacts')}</Text>
            </View>
          );
        }
        return (
          <FlatList
            data={visibleContacts}
            keyExtractor={(ct) => ct.id}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={renderContact}
            ListHeaderComponent={
              <View>
                <Text style={s.guide}>{t('contactPicker.guide')}</Text>
                {load.limited && <Text style={s.limitedNote}>{t('contactPicker.limitedNote')}</Text>}
                {showSearch && (
                  <View style={s.searchRow}>
                    <Search size={18} color={c.fgMuted} strokeWidth={1.5} />
                    <TextInput
                      style={s.searchInput}
                      value={query}
                      onChangeText={setQuery}
                      placeholder={t('contactPicker.search')}
                      placeholderTextColor={c.fgMuted}
                      accessibilityLabel={t('contactPicker.search')}
                      autoCorrect={false}
                      returnKeyType="search"
                      clearButtonMode="never"
                    />
                    {query.length > 0 && (
                      <Pressable
                        onPress={() => setQuery('')}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={t('home.searchClear')}
                        style={({ pressed }) => [s.searchClear, pressed && s.pressed]}
                      >
                        <X size={16} color={c.fgMuted} strokeWidth={1.5} />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            }
            ListEmptyComponent={
              q ? <Text style={s.noResults}>{t('home.searchNoResults', { query: query.trim() })}</Text> : null
            }
          />
        );
      }
    }
  };

  const canAdd = load.phase === 'ready' && selected.size > 0;
  // "Add" until something is picked (a disabled "Add 0" reads as a bug), then the
  // running count. common.add is already translated in every locale.
  const addLabel = selected.size > 0 ? t('contactPicker.addCount', { count: selected.size }) : t('common.add');

  return (
    <Modal
      visible={visible}
      // animationType is a prop, not a hook — nothing else in the app guards it,
      // so a literal here would slide in regardless of the OS Reduce Motion setting.
      animationType={reduceMotion ? 'none' : 'slide'}
      transparent={false}
      onRequestClose={close}
    >
      <SafeAreaProvider>
        <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.header}>
            <Text style={s.title} accessibilityRole="header">{t('contactPicker.title')}</Text>
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

          <View style={s.flex1}>{body()}</View>

          {/* Sticky commit bar — only when there's something to add. */}
          {load.phase === 'ready' && allContacts.length > 0 && (
            <View style={s.footer}>
              <Pressable
                onPress={commit}
                disabled={!canAdd}
                accessibilityRole="button"
                accessibilityLabel={addLabel}
                style={({ pressed }) => [s.addBtn, pressed && s.pressed, !canAdd && s.addBtnDisabled]}
              >
                <Text style={s.addBtnText}>{addLabel}</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex1: { flex: 1 },
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
    guide: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted, paddingBottom: space.s4 },
    limitedNote: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted, paddingBottom: space.s4 },
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
    rowDisabled: {},
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.hairlineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: c.inkButton, borderColor: c.inkButton },
    checkboxAdded: { borderColor: c.hairline, backgroundColor: c.bgSubtle },
    rowTitle: { flex: 1, ...ty.base, fontFamily: fontFamily.sans, color: c.fg, paddingVertical: space.s3 },
    rowTitleAdded: { color: c.fgMuted },
    addedTag: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    noResults: {
      ...ty.base,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      textAlign: 'center',
      paddingTop: space.s6,
    },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.s3, paddingHorizontal: space.s6 },
    centeredText: { ...ty.base, fontFamily: fontFamily.sans, color: c.fgMuted, textAlign: 'center' },
    footer: {
      ...boundedContent,
      paddingHorizontal: space.s5,
      paddingTop: space.s3,
      paddingBottom: space.s3,
      borderTopWidth: hairline,
      borderTopColor: c.hairline,
      backgroundColor: c.bg,
    },
    addBtn: {
      minHeight: target.min,
      borderRadius: radius.md,
      backgroundColor: c.inkButton,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.s5,
    },
    addBtnDisabled: { opacity: 0.4 },
    addBtnText: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.inkButtonText },
  });
}

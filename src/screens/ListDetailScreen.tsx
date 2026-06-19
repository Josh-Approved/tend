/**
 * List detail — the items in one list. The core loop of the archetype: add
 * (type in the field + submit), check off (tap the row), delete (the trailing
 * button). These three are the Tier-2 outcome assertions in qa/journey.json.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Check, Trash2 } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { useListsStore } from '../store/lists';
import { activeItems } from '../data/item';
import { ScreenHeader } from '../components/ScreenHeader';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ListDetail'>;

export default function ListDetailScreen({ route, navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const { listId } = route.params;
  const list = useListsStore((st) => st.lists.find((l) => l.id === listId));
  const addItem = useListsStore((st) => st.addItem);
  const setDone = useListsStore((st) => st.setDone);
  const deleteItem = useListsStore((st) => st.deleteItem);
  const [draft, setDraft] = useState('');

  if (!list) {
    // List was deleted out from under this screen — bounce home.
    navigation.goBack();
    return null;
  }

  const items = activeItems(list);

  const submit = () => {
    const name = draft.trim();
    if (!name) return;
    addItem(listId, name);
    setDraft('');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScreenHeader title={list.name} onBack={() => navigation.goBack()} />

      <View style={s.addRow}>
        <TextInput
          style={s.input}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder={t('list.addItem')}
          accessibilityLabel={t('list.addItem')}
          placeholderTextColor={c.fgSubtle}
          returnKeyType="done"
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim()}
          accessibilityRole="button"
          accessibilityLabel={t('common.add')}
          style={({ pressed }) => [s.addBtn, pressed && s.pressed, !draft.trim() && s.addBtnDisabled]}
        >
          <Plus size={22} color={c.fgOnInk} strokeWidth={2} />
        </Pressable>
      </View>

      {items.length === 0 ? (
        <EmptyState message={t('list.empty')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <View style={s.row} accessibilityLabel={item.name}>
              <Pressable
                onPress={() => setDone(listId, item.id, !item.done)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.done }}
                accessibilityLabel={item.name}
                style={({ pressed }) => [s.check, item.done && s.checkOn, pressed && s.pressed]}
              >
                {item.done ? <Check size={16} color={c.fgOnAccent} strokeWidth={3} /> : null}
              </Pressable>
              <Text style={[s.itemText, item.done && s.itemDone]}>{item.name}</Text>
              <Pressable
                onPress={() => deleteItem(listId, item.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t('common.delete')} ${item.name}`}
                style={({ pressed }) => [s.iconBtn, pressed && s.pressed]}
              >
                <Trash2 size={18} color={c.fgSubtle} strokeWidth={1.5} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    pressed: { opacity: 0.6 },
    addRow: {
      ...boundedContent,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s3,
      paddingHorizontal: space.s5,
      paddingVertical: space.s3,
    },
    input: {
      flex: 1,
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
    addBtnDisabled: { opacity: 0.4 },
    listContent: { ...boundedContent, paddingBottom: space.s9 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s4,
      minHeight: target.min + 6,
      paddingHorizontal: space.s5,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: c.hairlineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: c.accent, borderColor: c.accent },
    itemText: { ...ty.base, flex: 1, fontFamily: fontFamily.sans, color: c.fg },
    itemDone: { color: c.fgSubtle, textDecorationLine: 'line-through' },
    iconBtn: {
      width: target.min,
      height: target.min,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

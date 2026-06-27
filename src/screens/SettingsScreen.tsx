/**
 * Settings / About. App-specific settings (import from contacts + the "Your data"
 * export/import rows) sit ABOVE the canonical About block, which is the shared
 * <SettingsAbout/> component — the canonical entries are the floor, not the
 * ceiling (canon § Settings / About).
 */

import React, { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, Download, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { usePeopleStore } from '../store/people';
import { useConversationsStore } from '../store/conversations';
import { exportData, pickAndParseData } from '../lib/transfer';
import { importFromContacts } from '../lib/contacts';
import { AboutRow } from '../components/AboutRow';
import { SettingsAbout } from '../components/SettingsAbout';
import { ScreenHeader } from '../components/ScreenHeader';
import { t } from '../i18n';
import {
  useTheme,
  fontFamily,
  space,
  type as ty,
  boundedContent,
  type Colors,
  AppearanceToggle,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { c } = useTheme();
  const s = makeStyles(c);
  const people = usePeopleStore((st) => st.people);
  const importPeople = usePeopleStore((st) => st.importPeople);
  const conversations = useConversationsStore((st) => st.conversations);
  const importConversations = useConversationsStore((st) => st.importConversations);
  const [status, setStatus] = useState<string | null>(null);

  const onImportContacts = useCallback(async () => {
    const res = await importFromContacts();
    if (res && 'denied' in res) {
      setStatus(t('data.importDenied'));
      return;
    }
    const n = res && 'people' in res ? importPeople(res.people) : 0;
    setStatus(n > 0 ? t('data.imported', { count: n }) : t('data.importNone'));
  }, [importPeople]);

  const onExport = useCallback(() => {
    exportData(people, conversations).catch(() => setStatus(t('settings.couldntExport')));
  }, [people, conversations]);

  const onImport = useCallback(async () => {
    try {
      const { people: ppl, conversations: convs } = await pickAndParseData();
      const n = importPeople(ppl) + importConversations(convs);
      if (n === 0) {
        setStatus(t('settings.nothingImported'));
        return;
      }
      setStatus(t('data.imported', { count: n }));
    } catch {
      setStatus(t('settings.couldntRead'));
    }
  }, [importPeople, importConversations]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel}>{t('settings.appearance')}</Text>
        <AppearanceToggle
          labels={{
            title: t('settings.appearance'),
            system: t('settings.themeSystem'),
            light: t('settings.themeLight'),
            dark: t('settings.themeDark'),
          }}
        />

        <Text style={s.sectionLabel}>{t('settings.yourData')}</Text>
        <AboutRow label={t('home.importContacts')} icon={UserPlus} onPress={onImportContacts} />
        <AboutRow label={t('settings.export')} icon={Upload} onPress={onExport} />
        <AboutRow label={t('settings.import')} icon={Download} onPress={onImport} />
        {status ? <Text style={s.status}>{status}</Text> : null}

        <SettingsAbout onAcknowledgements={() => navigation.navigate('Acknowledgements')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    content: { ...boundedContent, paddingBottom: space.s9 },
    sectionLabel: {
      ...ty.xs,
      fontFamily: fontFamily.sansSemibold,
      color: c.fgMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: space.s6,
      paddingTop: space.s7,
      paddingBottom: space.s3,
    },
    status: {
      ...ty.sm,
      fontFamily: fontFamily.sans,
      color: c.fgMuted,
      paddingHorizontal: space.s6,
      paddingTop: space.s4,
    },
  });
}

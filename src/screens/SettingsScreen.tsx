/**
 * Settings / About. App-specific settings (the birthday-reminder toggle, import
 * from contacts, and the "Your data" export/import rows) sit ABOVE the canonical
 * About block, which is the shared
 * <SettingsAbout/> component — the canonical entries are the floor, not the
 * ceiling (canon § Settings / About).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, Download, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { usePeopleStore } from '../store/people';
import { useConversationsStore } from '../store/conversations';
import { useMeStore } from '../store/me';
import { exportData, pickAndParseData } from '../lib/transfer';
import {
  getBirthdayRemindersEnabled,
  setBirthdayRemindersEnabled,
  rescheduleAll,
} from '../lib/notifications';
import { ContactPicker } from '../components/ContactPicker';
import type { Person } from '../data/person';
import { AboutRow } from '../components/AboutRow';
import { SettingsAbout } from '../components/SettingsAbout';
import { ScreenHeader } from '../components/ScreenHeader';
import TipJarSheet from '../components/TipJarSheet';
import { TIP_PRODUCT_IDS } from '../constants/tipProducts';
import { LAUNCHED_AT } from '../constants/launch';
import { isWithinLaunchWindow } from '../storage/launchNotice';
import { TIP_JAR_ENABLED } from '../lib/links';
import { t } from '../i18n';
import {
  useTheme,
  fontFamily,
  space,
  target,
  type as ty,
  hairline,
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
  const me = useMeStore((st) => st.profile);
  const importMe = useMeStore((st) => st.importProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  // Birthday reminders default ON; read the stored value once on mount.
  const [birthdayReminders, setBirthdayReminders] = useState(true);

  useEffect(() => {
    let alive = true;
    getBirthdayRemindersEnabled().then((v) => {
      if (alive) setBirthdayReminders(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onToggleBirthdayReminders = useCallback(
    (next: boolean) => {
      setBirthdayReminders(next);
      setBirthdayRemindersEnabled(next)
        // Apply immediately: turning it off cancels the armed birthday alarms,
        // turning it back on re-arms them. Never prompts from here.
        .then(() => rescheduleAll(usePeopleStore.getState().people))
        .catch(() => {});
    },
    []
  );

  const onPicked = useCallback(
    (chosen: Person[]) => {
      const n = importPeople(chosen);
      setStatus(n > 0 ? t('data.imported', { count: n }) : t('data.importNone'));
    },
    [importPeople]
  );

  const onExport = useCallback(() => {
    exportData(people, conversations, me).catch(() => setStatus(t('settings.couldntExport')));
  }, [people, conversations, me]);

  const onImport = useCallback(async () => {
    try {
      const { people: ppl, conversations: convs, me: meImp } = await pickAndParseData();
      const n = importPeople(ppl) + importConversations(convs) + importMe(meImp);
      if (n === 0) {
        setStatus(t('settings.nothingImported'));
        return;
      }
      setStatus(t('data.imported', { count: n }));
    } catch {
      setStatus(t('settings.couldntRead'));
    }
  }, [importPeople, importConversations, importMe]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionLabel} accessibilityRole="header">{t('settings.appearance')}</Text>
        <AppearanceToggle
          labels={{
            title: t('settings.appearance'),
            system: t('settings.themeSystem'),
            light: t('settings.themeLight'),
            dark: t('settings.themeDark'),
          }}
        />

        <Text style={s.sectionLabel} accessibilityRole="header">{t('settings.reminders')}</Text>
        <View style={s.toggleRow}>
          <View style={s.toggleText} importantForAccessibility="no-hide-descendants">
            <Text style={s.toggleTitle}>{t('settings.birthdayReminders')}</Text>
            <Text style={s.toggleHint}>{t('settings.birthdayRemindersHint')}</Text>
          </View>
          <Switch
            value={birthdayReminders}
            onValueChange={onToggleBirthdayReminders}
            trackColor={{ false: c.hairlineStrong, true: c.fg }}
            thumbColor={c.bgElevated}
            ios_backgroundColor={c.hairlineStrong}
            accessibilityRole="switch"
            accessibilityLabel={t('settings.birthdayReminders')}
            accessibilityState={{ checked: birthdayReminders }}
          />
        </View>

        <Text style={s.sectionLabel} accessibilityRole="header">{t('settings.yourData')}</Text>
        <AboutRow label={t('home.importContacts')} icon={UserPlus} onPress={() => setPickerOpen(true)} />
        <AboutRow label={t('settings.export')} icon={Upload} onPress={onExport} />
        <AboutRow label={t('settings.import')} icon={Download} onPress={onImport} />
        {status ? <Text style={s.status}>{status}</Text> : null}

        {/* Launch-window note. Keeps the "we just launched, tell us what broke"
            signal available after the launch-notice card stops interrupting,
            and disappears on its own when the window closes. */}
        {isWithinLaunchWindow(LAUNCHED_AT) ? (
          <View style={s.launchNote}>
            <Text style={s.launchNoteTitle}>{t('launchNotice.settingsRow')}</Text>
            <Text style={s.launchNoteHint}>{t('launchNotice.settingsHint')}</Text>
          </View>
        ) : null}

        <SettingsAbout
          onAcknowledgements={() => navigation.navigate('Acknowledgements')}
          onSupport={TIP_JAR_ENABLED ? () => setTipVisible(true) : undefined}
        />
      </ScrollView>

      <ContactPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={onPicked} />
      {tipVisible && (
        <TipJarSheet visible onDismiss={() => setTipVisible(false)} productIds={TIP_PRODUCT_IDS} />
      )}
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
    // Same hairline row rhythm as AboutRow, with the native switch trailing —
    // the platform metaphor for an on/off setting.
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.s4,
      minHeight: target.min + 6,
      paddingVertical: space.s3,
      paddingHorizontal: space.s6,
      borderBottomWidth: hairline,
      borderBottomColor: c.hairline,
    },
    toggleText: { flex: 1, gap: 2 },
    toggleTitle: { ...ty.base, fontFamily: fontFamily.sans, color: c.fg },
    toggleHint: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
    launchNote: {
      gap: 2,
      paddingHorizontal: space.s6,
      paddingTop: space.s7,
    },
    launchNoteTitle: { ...ty.base, fontFamily: fontFamily.sansSemibold, color: c.fg },
    launchNoteHint: { ...ty.sm, fontFamily: fontFamily.sans, color: c.fgMuted },
  });
}

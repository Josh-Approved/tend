/**
 * App root for Tend. The shell (<AppShell/>) owns the chrome — gesture root, safe
 * area, error boundary, themed NavigationContainer, status bar, cold-start splash.
 *
 * Navigation: a bottom-tab navigator (Today | People) for the day-to-day surfaces,
 * inside a root stack that also holds the full-screen PersonDetail, Settings, and
 * Acknowledgements (so they cover the tab bar). Settings is reached via the gear,
 * not a tab — tabs are for surfaces you touch daily.
 */

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Sun, Users, MessageCircleHeart } from 'lucide-react-native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { useAppFonts, useTheme, fontFamily } from './src/theme';
import { AppShell } from './src/shell/AppShell';
import { usePeopleStore } from './src/store/people';
import { useConversationsStore } from './src/store/conversations';
import TodayScreen from './src/screens/TodayScreen';
import PeopleScreen from './src/screens/PeopleScreen';
import PersonDetailScreen from './src/screens/PersonDetailScreen';
import HTCScreen from './src/screens/HTCScreen';
import ConversationDetailScreen from './src/screens/ConversationDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Credits from './src/components/Credits';
import { t } from './src/i18n';
import { QA_MODE } from './src/qa/qaMode';

// Hold the native launch screen until the JS splash takes over (no icon blink).
// Must run at module scope, before first paint. Skipped under QA_MODE so the
// capture harness sees deterministic frames.
if (!QA_MODE) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export type TabParamList = {
  Today: undefined;
  People: undefined;
  HTC: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  PersonDetail: { personId: string };
  ConversationDetail: { conversationId: string };
  Settings: undefined;
  Acknowledgements: undefined;
};

/** Screen props for a tab screen that can also reach the root stack. */
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const { c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.appAccent,
        tabBarInactiveTintColor: c.fgMuted,
        tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.hairline },
        tabBarLabelStyle: { fontFamily: fontFamily.sans, fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: t('nav.today'),
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{
          tabBarLabel: t('nav.people'),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tab.Screen
        name="HTC"
        component={HTCScreen}
        options={{
          tabBarLabel: t('nav.htc'),
          tabBarIcon: ({ color, size }) => <MessageCircleHeart color={color} size={size} strokeWidth={1.75} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useAppFonts();
  const peopleHydrated = usePeopleStore((s) => s.hydrated);
  const hydratePeople = usePeopleStore((s) => s.hydrate);
  const conversationsHydrated = useConversationsStore((s) => s.hydrated);
  const hydrateConversations = useConversationsStore((s) => s.hydrate);

  useEffect(() => {
    // Sequential: people seed first so QA-mode conversations can link to them.
    (async () => {
      await hydratePeople();
      await hydrateConversations();
    })();
  }, [hydratePeople, hydrateConversations]);

  const ready = fontsLoaded && peopleHydrated && conversationsHydrated;

  return (
    <AppShell ready={ready}>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: QA_MODE ? 'none' : undefined }}>
        <RootStack.Screen name="Tabs" component={Tabs} />
        <RootStack.Screen name="PersonDetail" component={PersonDetailScreen} />
        <RootStack.Screen name="ConversationDetail" component={ConversationDetailScreen} />
        <RootStack.Screen name="Settings" component={SettingsScreen} />
        <RootStack.Screen name="Acknowledgements">
          {(props) => <Credits onBack={() => props.navigation.goBack()} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    </AppShell>
  );
}

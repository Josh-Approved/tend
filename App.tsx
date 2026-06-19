/**
 * App root for Tend. The shell (<AppShell/>) owns all the chrome — gesture root,
 * safe area, error boundary, themed NavigationContainer, status bar, and the
 * cold-start splash. This file owns only the readiness gate (fonts + store
 * hydration) and the screen list.
 */

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppFonts } from './src/theme';
import { AppShell } from './src/shell/AppShell';
import { usePeopleStore } from './src/store/people';
import PeopleHomeScreen from './src/screens/PeopleHomeScreen';
import PersonDetailScreen from './src/screens/PersonDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Credits from './src/components/Credits';
import { QA_MODE } from './src/qa/qaMode';

// Hold the native launch screen until the JS splash takes over (no icon blink).
// Must run at module scope, before first paint. Skipped under QA_MODE so the
// capture harness sees deterministic frames.
if (!QA_MODE) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export type RootStackParamList = {
  People: undefined;
  PersonDetail: { personId: string };
  Settings: undefined;
  Acknowledgements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useAppFonts();
  const hydrated = usePeopleStore((s) => s.hydrated);
  const hydrate = usePeopleStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ready = fontsLoaded && hydrated;

  return (
    <AppShell ready={ready}>
      <Stack.Navigator
        initialRouteName="People"
        screenOptions={{ headerShown: false, animation: QA_MODE ? 'none' : undefined }}
      >
        <Stack.Screen name="People" component={PeopleHomeScreen} />
        <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Acknowledgements">
          {(props) => <Credits onBack={() => props.navigation.goBack()} />}
        </Stack.Screen>
      </Stack.Navigator>
    </AppShell>
  );
}

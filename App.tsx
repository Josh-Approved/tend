/**
 * App root for the `list` archetype. The shell (<AppShell/>) owns all the
 * chrome — gesture root, safe area, error boundary, themed NavigationContainer,
 * status bar, and the cold-start splash. This file owns only the readiness gate
 * (fonts + store hydration) and the screen list.
 *
 * Rename the screens/params to your domain; the shape stays the same.
 */

import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppFonts } from './src/theme';
import { AppShell } from './src/shell/AppShell';
import { useListsStore } from './src/store/lists';
import ListsHomeScreen from './src/screens/ListsHomeScreen';
import ListDetailScreen from './src/screens/ListDetailScreen';
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
  ListsHome: undefined;
  ListDetail: { listId: string };
  Settings: undefined;
  Acknowledgements: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useAppFonts();
  const hydrated = useListsStore((s) => s.hydrated);
  const hydrate = useListsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ready = fontsLoaded && hydrated;

  return (
    <AppShell ready={ready}>
      <Stack.Navigator
        initialRouteName="ListsHome"
        screenOptions={{ headerShown: false, animation: QA_MODE ? 'none' : undefined }}
      >
        <Stack.Screen name="ListsHome" component={ListsHomeScreen} />
        <Stack.Screen name="ListDetail" component={ListDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Acknowledgements">
          {(props) => <Credits onBack={() => props.navigation.goBack()} />}
        </Stack.Screen>
      </Stack.Navigator>
    </AppShell>
  );
}

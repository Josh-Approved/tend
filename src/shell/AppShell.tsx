/**
 * The canonical app shell — the chrome that wraps every Josh Approved app:
 * gesture root, safe-area provider, error boundary, the themed
 * NavigationContainer + status bar, and the cold-start splash overlay. Removes
 * ~40 lines of identical boilerplate that used to live in every App.tsx.
 *
 * Canonical, app-agnostic — synced by `sync.mjs app-shell`; do not fork.
 *
 * Usage in App.tsx (the app owns only the readiness gate + the screen list):
 *
 *   <AppShell
 *     ready={fontsLoaded && hydrated}
 *     navigationRef={navigationRef}
 *     review={{
 *       appName: 'Grocery list',
 *       iosAppStoreId: '6779417031',
 *       androidPackageName: 'com.joshapproved.grocerylist',
 *     }}
 *     launchedAt="2026-08-09"
 *   >
 *     <Stack.Navigator screenOptions={{ headerShown: false }}>
 *       <Stack.Screen name="Home" component={HomeScreen} />
 *       ...
 *     </Stack.Navigator>
 *   </AppShell>
 *
 * Keep `SplashScreen.preventAutoHideAsync()` at module scope in App.tsx (it
 * must run before first paint); AppShell owns hiding it via AnimatedSplash.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  NavigationContainer,
  type NavigationContainerRef,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import AnimatedSplash from '../components/AnimatedSplash';
import ReviewModal from '../components/ReviewModal';
import LaunchNoticeModal from '../components/LaunchNoticeModal';
import { FeedbackProvider } from '../feedback/FeedbackProvider';
import { buildNavTheme } from './navTheme';
import { useApplyThemePreference } from '../theme';
import { useApplyLocalePreference, useLocaleVersion } from '../i18n/localePreference';
import { recordSessionStart } from '../storage/reviewPrompt';
import { shouldShowLaunchNotice } from '../storage/launchNotice';
import { logEvent, logNav } from '../feedback/log';
import { QA_MODE } from '../qa/qaMode';

/** Beat between the splash finishing and a shell card appearing, so it fades in
 *  on a settled screen instead of racing the splash out. */
const REVIEW_PROMPT_DELAY_MS = 800;

/**
 * The name of the screen the user is actually looking at, walking down through
 * nested navigators. Route NAMES only — params are never read, because params
 * routinely carry user content (a list name, an item id) and the diagnostic log
 * is content-free by contract (feedback/log.ts § PRIVACY CONTRACT).
 */
function activeRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined
): string | null {
  let node: any = state;
  let name: string | null = null;
  // Bounded walk — a malformed/cyclic state must not spin the JS thread.
  for (let depth = 0; node && depth < 12; depth++) {
    const routes = node.routes;
    if (!Array.isArray(routes) || routes.length === 0) break;
    const route = routes[typeof node.index === 'number' ? node.index : routes.length - 1];
    if (!route) break;
    if (route.name) name = String(route.name);
    node = route.state;
  }
  return name;
}

type Props = {
  /** Content is ready (fonts loaded + stores hydrated). Until true, the splash
   *  holds and the navigator is not mounted. */
  ready: boolean;
  /** The navigator tree (a <Stack.Navigator> with the app's screens). */
  children: React.ReactNode;
  /** Optional navigation ref for deep-linking / share-link pairing. */
  navigationRef?: React.Ref<NavigationContainerRef<any>>;
  /**
   * Store identity for the canonical review prompt. Pass it and the shell owns
   * the whole thing — session counting, the 3/15/30 schedule, the 3-per-install
   * cap, and mounting <ReviewModal>. Apps carry NO trigger code (canon §
   * Review prompt). Omit it and no prompt is ever counted or shown.
   */
  review?: {
    /** App name as shown in the title — sentence case, no trademark. */
    appName: string;
    /** Numeric App Store ID (e.g. "6766071864"). */
    iosAppStoreId: string;
    /** Android applicationId (e.g. "com.joshapproved.grocerylist"). */
    androidPackageName: string;
  };
  /**
   * The app's real public launch date as an ISO date ("2026-08-09") — the day
   * its store listing went live, not the build or submission date. Pass it and
   * the shell owns the launch-notice card: the sessions-1-to-3 cap, the 60-day
   * window, and mounting <LaunchNoticeModal>. Apps carry no trigger code
   * (templates/launch-notice/README.md). Omit it and the card never shows.
   */
  launchedAt?: string;
};

export function AppShell({
  ready,
  children,
  navigationRef,
  review,
  launchedAt,
}: Props) {
  // Restore + apply the saved appearance preference (System/Light/Dark) once,
  // before first paint. Drives useColorScheme() below and in every screen.
  useApplyThemePreference();
  // Restore + apply the saved language (System, or a locale the user chose). The
  // version keys <NavigationContainer> below so an explicit switch re-renders the
  // whole tree in the new language (canon § Translations). System needs no
  // remount — the device locale is applied on i18n import.
  useApplyLocalePreference();
  const localeVersion = useLocaleVersion();
  const isDark = useColorScheme() === 'dark';
  const [splashDone, setSplashDone] = useState(false);

  // ---- Review prompt (canon § Review prompt) -------------------------------
  // The trigger is a SESSION — one app cold start, i.e. one JS boot — so this
  // effect must count exactly once per boot no matter how many times the shell
  // re-renders. The ref is that guard; state can't be (a re-render reads the
  // stale value before the async resolve lands).
  //
  // Two hard rules, both encoded below:
  //   1. Never under QA_MODE. The deterministic capture pipeline must never
  //      meet a surprise modal, and a capture run must not burn a session
  //      either — so QA_MODE doesn't even count the boot.
  //   2. Never over the splash. The prompt waits for `splashDone && ready`,
  //      then a short beat, so it lands on a settled first screen.
  //
  // PRECEDENCE — one shell modal per session. If the launch-notice card
  // (templates/launch-notice) is showing this session, the review prompt does
  // NOT show: two cards stacked on a cold start is exactly the "vies for the
  // user's attention" pattern tenet 5 forbids, and the launch notice is the
  // more time-sensitive of the two (it has a 60-day window; the review ask does
  // not). Nothing is lost by yielding — eligibility is a `>=` check on the
  // session count, so the review prompt simply re-fires the next session. That
  // is why the session is still COUNTED below even when the prompt yields.
  // The launch-notice effect resolves first and the review effect waits on it.
  // ---- Breadcrumbs (feedback/log.ts) --------------------------------------
  // A bug report is only triageable if it says what the app was doing. The shell
  // is the one place that sees every screen change, so it owns the trail; screens
  // and stores add their own domain events on top. Route NAMES only.
  const lastRoute = useRef<string | null>(null);
  const readyLogged = useRef(false);
  useEffect(() => {
    if (!ready || readyLogged.current) return;
    readyLogged.current = true;
    logEvent('app', 'ready', { theme: isDark ? 'dark' : 'light' });
  }, [ready, isDark]);

  // ---- Launch notice (templates/launch-notice) -----------------------------
  // Same two hard rules as the review prompt: never under QA_MODE, never over
  // the splash. Resolved once per boot; `launchNoticeSettled` is what the
  // review effect waits on, so the precedence call is made before either card
  // can appear rather than raced between two async reads.
  const [showLaunchNotice, setShowLaunchNotice] = useState(false);
  const [launchNoticeSettled, setLaunchNoticeSettled] = useState(false);
  const launchNoticeChecked = useRef(false);
  const launchNoticeShowing = useRef(false);
  const hasLaunchNotice = !!launchedAt;
  useEffect(() => {
    if (!ready || !splashDone) return;
    if (launchNoticeChecked.current) return;
    launchNoticeChecked.current = true;
    if (!hasLaunchNotice || QA_MODE) {
      setLaunchNoticeSettled(true);
      return;
    }
    let cancelled = false;
    shouldShowLaunchNotice(launchedAt as string)
      .then((show) => {
        if (cancelled) return;
        if (show) {
          launchNoticeShowing.current = true;
          logEvent('launch-notice', 'card shown');
          setShowLaunchNotice(true);
        }
        setLaunchNoticeSettled(true);
      })
      .catch(() => {
        if (!cancelled) setLaunchNoticeSettled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasLaunchNotice, launchedAt, ready, splashDone]);

  const [showReview, setShowReview] = useState(false);
  const sessionCounted = useRef(false);
  // Depend on the BOOLEAN, never the `review` object: apps pass it as an inline
  // literal, so its identity changes on every render — depending on it would
  // re-run the effect, and the cleanup would cancel the pending prompt forever.
  const hasReview = !!review;
  useEffect(() => {
    if (!hasReview || QA_MODE) return;
    if (!ready || !splashDone) return;
    if (!launchNoticeSettled) return;
    if (sessionCounted.current) return;
    sessionCounted.current = true;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The session is counted either way — yielding to the launch notice must
    // not stall the schedule, it just skips this session's display.
    recordSessionStart().then((shouldPrompt) => {
      if (cancelled || !shouldPrompt) return;
      if (launchNoticeShowing.current) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        logEvent('review', 'prompt shown');
        setShowReview(true);
      }, REVIEW_PROMPT_DELAY_MS);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasReview, ready, splashDone, launchNoticeSettled]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          {ready && (
            <NavigationContainer
              key={localeVersion}
              ref={navigationRef}
              theme={buildNavTheme(isDark)}
              onStateChange={(state) => {
                const name = activeRouteName(state);
                if (name && name !== lastRoute.current) {
                  lastRoute.current = name;
                  logNav(name);
                }
              }}
            >
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <FeedbackProvider>{children}</FeedbackProvider>
            </NavigationContainer>
          )}
          {review && (
            <ReviewModal
              visible={showReview}
              onDismiss={() => setShowReview(false)}
              appName={review.appName}
              iosAppStoreId={review.iosAppStoreId}
              androidPackageName={review.androidPackageName}
            />
          )}
          {launchedAt && (
            <LaunchNoticeModal
              visible={showLaunchNotice}
              onDismiss={() => {
                launchNoticeShowing.current = false;
                setShowLaunchNotice(false);
              }}
            />
          )}
          {!QA_MODE && !splashDone && (
            <AnimatedSplash ready={ready} onFinish={() => setSplashDone(true)} />
          )}
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

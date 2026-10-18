// Regression net for defect tend-20260914-1: SIGSEGV in
// FabricUIManagerBinding::findNextFocusableElement (RN 0.86 use-after-free in
// findShadowNodeByTag_DEPRECATED). The fix is a config plugin that turns on
// RN's own `fixFindShadowNodeByTagRaceCondition` flag in MainApplication.kt.
// A native race can't be reproduced in Jest; what CAN silently regress is the
// plugin no longer landing the override (template drift, anchor change, the
// plugin dropped from app.json). These tests pin that.

/* eslint-disable @typescript-eslint/no-var-requires */
// The pure transform is what's under test; @expo/config-plugins pulls ESM-only
// deps (xcode) Jest can't load, so stub the one mod helper the plugin imports.
// The stub runs the mod callback inline so the wrapper's gating (Kotlin only,
// flag still present) is exercised too, not just the string transform.
jest.mock('expo/config-plugins', () => ({
  withMainApplication: (config: unknown, mod: (c: unknown) => unknown) => mod(config),
}));

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/** The MainApplication.kt `expo prebuild` will actually write, read out of the
 *  prebuild template bundled in node_modules/expo. This is the file the plugin
 *  has to anchor into; pinning it here turns "the Expo template moved" into a
 *  red `npm test` instead of a Kotlin compile error 45 minutes into a build. */
function expoTemplateMainApplication(): string {
  const tgz = path.join(path.dirname(require.resolve('expo/package.json')), 'template.tgz');
  const entry = 'package/android/app/src/main/java/com/helloworld/MainApplication.kt';
  return execFileSync('tar', ['xzOf', tgz, entry], { encoding: 'utf8' });
}

/** A throwaway project root whose react-native provider does / doesn't declare the flag. */
function fakeProjectRoot(withFlag: boolean): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tend-rnflag-'));
  const rn = path.join(root, 'node_modules', 'react-native');
  const dir = path.join(rn, 'ReactAndroid/src/main/java/com/facebook/react/internal/featureflags');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(rn, 'package.json'), JSON.stringify({ name: 'react-native', version: '0.0.0' }));
  fs.writeFileSync(
    path.join(dir, 'ReactNativeFeatureFlagsProvider.kt'),
    'public interface ReactNativeFeatureFlagsProvider {\n' +
      (withFlag ? '  @DoNotStrip public fun fixFindShadowNodeByTagRaceCondition(): Boolean\n' : '') +
      '  @DoNotStrip public fun enableFabricRenderer(): Boolean\n}\n'
  );
  return root;
}

function runPlugin(projectRoot: string, contents = SDK57_MAIN_APPLICATION, language = 'kt'): string {
  const cfg = plugin({ modResults: { language, contents }, modRequest: { projectRoot } });
  return cfg.modResults.contents;
}

const plugin = require('../../plugins/withFabricFindNodeRaceFix');
const appJson = require('../../app.json');

const SDK57_MAIN_APPLICATION = `package com.joshapproved.tend

class MainApplication : Application(), ReactApplication {
  override fun onCreate() {
    super.onCreate()
    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }
    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
}
`;

describe('withFabricFindNodeRaceFix (tend-20260914-1)', () => {
  it('is registered in app.json plugins', () => {
    expect(appJson.expo.plugins).toContain('./plugins/withFabricFindNodeRaceFix');
  });

  it('forces the race-condition flag on, after loadReactNative and before lifecycle dispatch', () => {
    const out: string = plugin.applyFlagOverride(SDK57_MAIN_APPLICATION);
    const load = out.indexOf('loadReactNative(this)');
    const override = out.indexOf('override fun fixFindShadowNodeByTagRaceCondition(): Boolean = true');
    const force = out.indexOf('ReactNativeFeatureFlags.dangerouslyForceOverride(');
    const dispatch = out.indexOf('ApplicationLifecycleDispatcher.onApplicationCreate');
    expect(load).toBeGreaterThan(-1);
    expect(force).toBeGreaterThan(load);
    expect(override).toBeGreaterThan(force);
    expect(dispatch).toBeGreaterThan(override);
  });

  it('keeps the release-level base provider for every level', () => {
    const out: string = plugin.applyFlagOverride(SDK57_MAIN_APPLICATION);
    expect(out).toContain('ReactNativeFeatureFlagsOverrides_RNOSS_Stable_Android()');
    expect(out).toContain('ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android()');
    expect(out).toContain('ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android()');
    expect(out).toContain('ReactNativeFeatureFlagsProvider by base');
  });

  it('is idempotent', () => {
    const once: string = plugin.applyFlagOverride(SDK57_MAIN_APPLICATION);
    expect(plugin.applyFlagOverride(once)).toBe(once);
  });

  it('leaves a file without the anchor untouched', () => {
    const src = 'class MainApplication { fun onCreate() {} }';
    expect(plugin.applyFlagOverride(src)).toBe(src);
  });

  it('applies against the installed react-native (the flag still exists on 0.86)', () => {
    const rn = require('react-native/package.json');
    if (/^0\.86\./.test(rn.version)) {
      expect(plugin.reactNativeHasFlag(process.cwd())).toBe(true);
    }
  });

  it('the config plugin applies the override when react-native still declares the flag', () => {
    const out = runPlugin(fakeProjectRoot(true));
    expect(out.split(plugin.MARKER).length - 1).toBe(1);
    expect(out).toContain('override fun fixFindShadowNodeByTagRaceCondition(): Boolean = true');
  });

  it('the config plugin is idempotent across repeated prebuilds', () => {
    const root = fakeProjectRoot(true);
    const once = runPlugin(root);
    expect(runPlugin(root, once)).toBe(once);
  });

  it('self-retires: a no-op once react-native drops the flag (0.87+, fix always on)', () => {
    const root = fakeProjectRoot(false);
    expect(plugin.reactNativeHasFlag(root)).toBe(false);
    expect(runPlugin(root)).toBe(SDK57_MAIN_APPLICATION);
  });

  it('anchors into the real Expo prebuild template, and its imports cover the Kotlin we emit', () => {
    const src = expoTemplateMainApplication();
    // The anchor the plugin keys off must exist in the file prebuild writes.
    expect(src).toMatch(/^[ \t]*loadReactNative\(this\)[ \t]*$/m);
    // The emitted block names DefaultNewArchitectureEntryPoint unqualified, so
    // the template must import it (everything else we emit is fully qualified).
    expect(src).toContain('import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint');

    const out: string = plugin.applyFlagOverride(src);
    expect(out).not.toBe(src);
    const load = out.indexOf('loadReactNative(this)');
    const force = out.indexOf('ReactNativeFeatureFlags.dangerouslyForceOverride(');
    const dispatch = out.indexOf('ApplicationLifecycleDispatcher.onApplicationCreate');
    expect(force).toBeGreaterThan(load);
    expect(dispatch).toBeGreaterThan(force);
  });

  it('is a no-op for a Java MainApplication', () => {
    expect(runPlugin(fakeProjectRoot(true), 'class MainApplication {}', 'java')).toBe('class MainApplication {}');
  });

  it('fails the prebuild loudly when the anchor moved, instead of shipping without the fix', () => {
    expect(() => runPlugin(fakeProjectRoot(true), 'class MainApplication { fun onCreate() {} }')).toThrow(
      /NOT applied/
    );
  });
});

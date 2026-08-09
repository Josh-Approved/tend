const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod, AndroidConfig } = require('expo/config-plugins');

// Declares the app's translated locales to Android (canon § Translations —
// "Declare localizations in the build"). Without this, the OS per-app language
// screen and the Play listing's Languages field see English only, because our
// translations are runtime-only (a JS dictionary), not Android resource folders
// the platform can discover on its own.
//
// Expo SDK 56 has no `expo.android.localeConfig` config key (verified against
// @expo/config-types — the android object has no locale field at all), so
// writing one into app.json would be a no-op that silently reads as done. This
// plugin does the real work at prebuild instead: it writes
// res/xml/locales_config.xml and points the manifest's <application> at it via
// android:localeConfig, which is what Android 13+ (API 33) per-app language
// preferences read.
//
// Keep LOCALES matched to src/i18n/locales.ts and to
// ios.infoPlist.CFBundleLocalizations in app.json — the two platforms must
// claim the same set. BCP-47 tags; Android wants the region separated with
// "-" here (pt-BR), which it maps to its own values-b+pt+BR resource form.
const LOCALES = ['en', 'es', 'de', 'fr', 'it', 'pt-BR', 'ja'];

const RES_XML_DIR = ['app', 'src', 'main', 'res', 'xml'];
const FILE_NAME = 'locales_config.xml';

function localesConfigXml(locales) {
  const entries = locales.map((l) => `    <locale android:name="${l}"/>`).join('\n');
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<locale-config xmlns:android="http://schemas.android.com/apk/res/android">',
    entries,
    '</locale-config>',
    '',
  ].join('\n');
}

module.exports = function withAndroidLocaleConfig(config) {
  // 1. Write res/xml/locales_config.xml.
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, ...RES_XML_DIR);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, FILE_NAME), localesConfigXml(LOCALES), 'utf8');
      return cfg;
    },
  ]);

  // 2. Point <application android:localeConfig> at it.
  return withAndroidManifest(config, (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    application.$['android:localeConfig'] = '@xml/locales_config';
    return cfg;
  });
};

// Exported for the unit test — the generated XML is the whole contract.
module.exports.LOCALES = LOCALES;
module.exports.localesConfigXml = localesConfigXml;

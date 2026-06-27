/**
 * Personality catalog for Tend — the value sets per framework (in display order)
 * and the i18n key helpers the detail screen renders through. PURE, app-owned,
 * no RN imports.
 *
 * The stored shape (PersonalityType) + the trust-core getter/setter live in
 * ./person; the human-readable labels + our own plain "how to relate" guidance
 * live in i18n (appStrings → `personality.*`). This file is only the structure
 * that ties the two together, so adding a framework later is one entry here plus
 * its strings — no screen changes.
 *
 * IP note: enneagram + attachment are open frameworks; the guidance text is our
 * own plain wording. No trademarked names or copied text (no MBTI®, no "Love
 * Languages").
 */

import type { PersonalityFramework } from './person';

export interface FrameworkCatalog {
  framework: PersonalityFramework;
  /** Stored value keys, in the order chips render. */
  values: readonly string[];
}

export const PERSONALITY_CATALOG: readonly FrameworkCatalog[] = [
  { framework: 'enneagram', values: ['1', '2', '3', '4', '5', '6', '7', '8', '9'] },
  { framework: 'attachment', values: ['secure', 'anxious', 'avoidant', 'disorganized'] },
];

/** i18n key for a framework's section label (e.g. "Enneagram type"). */
export const frameworkLabelKey = (f: PersonalityFramework): string => `personality.framework.${f}`;

/** i18n key for the short chip label (e.g. "5", "Secure"). */
export const optionShortKey = (f: PersonalityFramework, v: string): string => `personality.${f}.${v}.short`;

/** i18n key for the full type name shown in the guidance card. */
export const optionLabelKey = (f: PersonalityFramework, v: string): string => `personality.${f}.${v}.label`;

/** i18n key for our plain "how to show up for them" guidance. */
export const optionRelateKey = (f: PersonalityFramework, v: string): string => `personality.${f}.${v}.relate`;

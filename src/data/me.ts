/**
 * The "Me" manual — a personal user manual you author about yourself: the things
 * you'd want the people who love you to understand. It's the dignity/consent
 * counterweight to keeping notes about others (mirror every "about them" with an
 * "about you"), and it's shareable — its whole point is to be sent.
 *
 * APP-OWNED TRUST CORE: pure (no expo / RN imports). The catalog is the ordered
 * set of prompts; the profile is a flat key→text map. composeManualText turns the
 * filled prompts into readable text for the share sheet (pure — a label lookup is
 * passed in, so i18n stays out of the core and it's unit-testable).
 */

export interface MePrompt {
  key: string;
}

/** The prompts, in display + share order. Labels/placeholders live in i18n under
 *  `me.prompt.<key>.{label,placeholder}`. Every prompt is optional. */
export const ME_PROMPTS: readonly MePrompt[] = [
  { key: 'communicate' },
  { key: 'feedback' },
  { key: 'conflict' },
  { key: 'feelCared' },
  { key: 'showCare' },
  { key: 'fillsMeUp' },
  { key: 'drains' },
  { key: 'growth' },
  { key: 'support' },
  { key: 'values' },
];

const PROMPT_KEYS = new Set(ME_PROMPTS.map((p) => p.key));

/** A flat map of prompt key → the text you wrote. Missing/blank = unanswered. */
export type MeProfile = Record<string, string>;

export const mePromptLabelKey = (key: string): string => `me.prompt.${key}.label`;
export const mePromptPlaceholderKey = (key: string): string => `me.prompt.${key}.placeholder`;

/** True when nothing has been filled in yet (controls the empty state + disables
 *  the share action). Pure. */
export function meIsEmpty(profile: MeProfile): boolean {
  return ME_PROMPTS.every((p) => !(profile[p.key] ?? '').trim());
}

/**
 * Compose the filled prompts into readable, shareable text. Only answered prompts
 * appear, in catalog order, each under its label. `labelFor` maps a prompt key to
 * its display label (the screen passes t(...)); `heading` tops the message. Pure.
 */
export function composeManualText(
  profile: MeProfile,
  labelFor: (key: string) => string,
  heading: string
): string {
  const blocks: string[] = [heading];
  for (const p of ME_PROMPTS) {
    const value = (profile[p.key] ?? '').trim();
    if (!value) continue;
    blocks.push(`${labelFor(p.key)}\n${value}`);
  }
  return blocks.join('\n\n');
}

/** Coerce an untrusted parsed object into a safe MeProfile for additive import —
 *  only known prompt keys with string values survive. Pure. */
export function sanitizeImportedMe(raw: unknown): MeProfile {
  const out: MeProfile = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (PROMPT_KEYS.has(k) && typeof v === 'string' && v.trim()) out[k] = v;
  }
  return out;
}

/**
 * Additive merge: fill only the fields that are currently empty (never clobber
 * what you've already written). Returns the merged profile + how many fields were
 * newly filled. Pure.
 */
export function mergeMeProfile(current: MeProfile, incoming: MeProfile): { profile: MeProfile; added: number } {
  const profile: MeProfile = { ...current };
  let added = 0;
  for (const p of ME_PROMPTS) {
    const has = (current[p.key] ?? '').trim();
    const inc = (incoming[p.key] ?? '').trim();
    if (!has && inc) {
      profile[p.key] = incoming[p.key];
      added += 1;
    }
  }
  return { profile, added };
}

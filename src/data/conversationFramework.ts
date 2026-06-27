/**
 * The HTC conversation framework — which tailored prompts each flavor adds on top
 * of the always-shown core, plus the i18n key helpers the detail screen renders
 * through. PURE, app-owned, no RN imports.
 *
 * The stored shape (Conversation) + selectors live in ./conversation; the
 * human-readable labels/placeholders/guidance live in i18n (appStrings → `htc.*`).
 * This file is only the structure that ties them together, so adding a flavor
 * later is one entry here plus its strings.
 *
 * Core fields (always): topic · story ("the story I'm telling myself") · impact ·
 * hope. The apology flavor is the rich one — it carries the full reconciliation
 * loop (name what you did → name the hurt → ask for forgiveness).
 */

import type { ConversationFlavor } from './conversation';

/** A tailored prompt a flavor adds. Label + placeholder come from i18n under
 *  `htc.prompt.<key>.{label,placeholder}`; the stored value lives in
 *  Conversation.flavorFields[key]. */
export interface FlavorPrompt {
  key: string;
  multiline?: boolean;
}

export interface FlavorDef {
  flavor: ConversationFlavor;
  /** Extra prompts beyond the core, in display order. */
  prompts: readonly FlavorPrompt[];
}

export const FLAVOR_CATALOG: readonly FlavorDef[] = [
  { flavor: 'open', prompts: [] },
  { flavor: 'hurt', prompts: [{ key: 'iStatement', multiline: true }] },
  { flavor: 'aboutMe', prompts: [{ key: 'vulnerable', multiline: true }] },
  { flavor: 'boundary', prompts: [{ key: 'need', multiline: true }] },
  {
    flavor: 'apology',
    // The reconciliation loop — the heart of a real apology.
    prompts: [
      { key: 'sorryFor', multiline: true },
      { key: 'theHurt', multiline: true },
      { key: 'askForgiveness', multiline: false },
    ],
  },
  { flavor: 'appreciation', prompts: [{ key: 'holdingBack', multiline: true }] },
];

export function flavorDef(flavor: ConversationFlavor): FlavorDef {
  return FLAVOR_CATALOG.find((f) => f.flavor === flavor) ?? FLAVOR_CATALOG[0];
}

/** i18n key for a flavor's chip label (e.g. "Something that hurt me"). */
export const flavorLabelKey = (f: ConversationFlavor): string => `htc.flavor.${f}`;

/** i18n keys for a tailored prompt. */
export const promptLabelKey = (key: string): string => `htc.prompt.${key}.label`;
export const promptPlaceholderKey = (key: string): string => `htc.prompt.${key}.placeholder`;

/** Apology is the only flavor with a supporting note (the reconciliation loop). */
export const flavorHasNote = (f: ConversationFlavor): boolean => f === 'apology';
export const flavorNoteKey = (f: ConversationFlavor): string => `htc.note.${f}`;

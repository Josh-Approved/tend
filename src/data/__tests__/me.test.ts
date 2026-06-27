/**
 * Trust-core unit tests (canon § QA & testing Tier 1) for the Me manual. The pure
 * layer in ../me: the empty check that gates the share action, the share-text
 * composer (filled prompts only, in order), crash-proof import sanitization, and
 * the additive merge that never clobbers what you've already written.
 */

import { describe, it, expect } from '@jest/globals';
import { meIsEmpty, composeManualText, sanitizeImportedMe, mergeMeProfile, type MeProfile } from '../me';

const label = (k: string) => `LABEL:${k}`;

describe('meIsEmpty', () => {
  it('is true for blank/whitespace-only, false once anything real is filled', () => {
    expect(meIsEmpty({})).toBe(true);
    expect(meIsEmpty({ communicate: '   ' })).toBe(true);
    expect(meIsEmpty({ values: 'Honesty' })).toBe(false);
  });
});

describe('composeManualText', () => {
  it('includes only filled prompts, in catalog order, under their labels', () => {
    const profile: MeProfile = { values: 'Honesty', communicate: 'In writing', bogus: 'ignored' };
    const text = composeManualText(profile, label, 'A bit about me');
    // 'communicate' comes before 'values' in the catalog regardless of insertion order
    expect(text).toBe('A bit about me\n\nLABEL:communicate\nIn writing\n\nLABEL:values\nHonesty');
    // an unknown key is never emitted (not in the catalog)
    expect(text).not.toContain('bogus');
  });

  it('is just the heading when nothing is filled', () => {
    expect(composeManualText({}, label, 'A bit about me')).toBe('A bit about me');
  });
});

describe('sanitizeImportedMe', () => {
  it('keeps only known prompt keys with non-empty string values', () => {
    const safe = sanitizeImportedMe({ communicate: 'x', values: '  ', feedback: 5, junk: 'no' });
    expect(safe).toEqual({ communicate: 'x' });
    expect(sanitizeImportedMe(null)).toEqual({});
    expect(sanitizeImportedMe('nope')).toEqual({});
  });
});

describe('mergeMeProfile (additive)', () => {
  it('fills only empty fields and never overwrites existing answers', () => {
    const current: MeProfile = { communicate: 'mine', values: '' };
    const incoming: MeProfile = { communicate: 'theirs', values: 'Honesty', growth: 'Patience' };
    const { profile, added } = mergeMeProfile(current, incoming);
    expect(profile.communicate).toBe('mine'); // not clobbered
    expect(profile.values).toBe('Honesty'); // filled (was blank)
    expect(profile.growth).toBe('Patience'); // filled (was missing)
    expect(added).toBe(2);
  });
});

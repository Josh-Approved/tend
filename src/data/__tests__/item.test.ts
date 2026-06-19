/**
 * Trust-core unit tests (canon § QA & testing Tier 1) for the `list` archetype.
 * The trust core here is the pure data layer: constructors produce valid
 * records, name-dedup is case-insensitive and skips tombstones, and import
 * sanitization is additive + never crashes on a hand-edited file. These are the
 * worked examples a refactor would silently break. Expand for your domain.
 */

import { describe, it, expect } from '@jest/globals';
import {
  makeItem,
  makeList,
  findActiveByName,
  activeItems,
  sanitizeImportedList,
} from '../item';

describe('constructors', () => {
  it('makeItem trims the name and starts not-done', () => {
    const it = makeItem('  Milk  ');
    expect(it.name).toBe('Milk');
    expect(it.done).toBe(false);
    expect(it.id).toMatch(/^i/);
    expect(it.addedAt).toBeGreaterThan(0);
  });

  it('makeList defaults an empty name and mints a unique id', () => {
    const a = makeList('');
    const b = makeList('');
    expect(a.name).toBe('New list');
    expect(a.id).not.toBe(b.id);
  });
});

describe('findActiveByName', () => {
  it('matches case-insensitively and ignores tombstoned items', () => {
    const list = makeList('Shop');
    list.items = [makeItem('Eggs'), makeItem('Bread')];
    expect(findActiveByName(list, 'eggs')?.name).toBe('Eggs');
    list.items[0].deletedAt = Date.now();
    expect(findActiveByName(list, 'eggs')).toBeUndefined();
    expect(activeItems(list)).toHaveLength(1);
  });
});

describe('sanitizeImportedList', () => {
  it('re-mints ids, marks (imported), and keeps only valid items', () => {
    const safe = sanitizeImportedList({
      id: 'OLD-COLLIDING-ID',
      name: 'Trip',
      items: [{ name: 'Tent', done: true }, { nope: 1 }, 'garbage'],
    });
    expect(safe).not.toBeNull();
    expect(safe!.id).not.toBe('OLD-COLLIDING-ID');
    expect(safe!.name).toBe('Trip (imported)');
    expect(safe!.items).toHaveLength(1);
    expect(safe!.items[0].done).toBe(true);
    expect(safe!.items[0].id).toMatch(/^i/);
  });

  it('returns null for non-list shapes instead of throwing', () => {
    expect(sanitizeImportedList(null)).toBeNull();
    expect(sanitizeImportedList({ name: 'x' })).toBeNull();
    expect(sanitizeImportedList({ items: [] })).toBeNull();
    expect(sanitizeImportedList('nope')).toBeNull();
  });
});

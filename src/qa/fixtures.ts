/**
 * QA fixtures — deterministic data the app boots with under QA_MODE (the
 * capture pipeline builds with EXPO_PUBLIC_QA_MODE=1). Built with the app's OWN
 * constructors so it's valid by construction. Rename to your domain.
 */

import { makeList, makeItem, type ItemList } from '../data/item';

export function qaLists(): ItemList[] {
  const list = makeList('Weekend plan');
  const names = ['Book the campsite', 'Pack the cooler', 'Check the weather', 'Fill the tank', 'Charge headlamps'];
  list.items = names.map(makeItem);
  // A couple done so the progress count reads as a real, mid-task list.
  list.items[0].done = true;
  list.items[2].done = true;
  return [list];
}

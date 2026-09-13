/**
 * PersonDetailSheets — the focused edit sheets the person hub's summary rows open
 * (how often, how we met, notes, dates, likes & gifts, personality). Split out of
 * PersonDetailScreen so the hub stays under the screen size ceiling; the hub owns
 * WHICH sheet is open, this owns wiring each one to the people store.
 */

import React from 'react';
import { usePeopleStore } from '../store/people';
import { getBirthday, otherImportantDates, isBirthday, type Person } from '../data/person';
import { CadenceSheet } from './CadenceSheet';
import { PersonTextSheet } from './PersonTextSheet';
import { DatesSheet } from './DatesSheet';
import { PrefsSheet } from './PrefsSheet';
import { PersonalitySheet } from './PersonalitySheet';
import { t } from '../i18n';

export type SheetId = 'cadence' | 'howWeMet' | 'notes' | 'dates' | 'prefs' | 'personality' | null;

interface Props {
  person: Person;
  sheet: SheetId;
  onClose: () => void;
}

export function PersonDetailSheets({ person, sheet, onClose }: Props) {
  const setCadence = usePeopleStore((st) => st.setCadence);
  const setNotes = usePeopleStore((st) => st.setNotes);
  const setHowWeMet = usePeopleStore((st) => st.setHowWeMet);
  const addImportantDate = usePeopleStore((st) => st.addImportantDate);
  const removeImportantDate = usePeopleStore((st) => st.removeImportantDate);
  const setBirthday = usePeopleStore((st) => st.setBirthday);
  const clearBirthday = usePeopleStore((st) => st.clearBirthday);
  const addPreference = usePeopleStore((st) => st.addPreference);
  const removePreference = usePeopleStore((st) => st.removePreference);
  const setPersonalityType = usePeopleStore((st) => st.setPersonalityType);

  return (
    <>
      <CadenceSheet
        visible={sheet === 'cadence'}
        value={person.cadenceDays}
        onClose={onClose}
        onPick={(days) => setCadence(person.id, days)}
      />
      <PersonTextSheet
        visible={sheet === 'howWeMet'}
        title={t('person.howWeMetLabel')}
        value={person.howWeMet ?? ''}
        placeholder={t('person.howWeMetPlaceholder')}
        onClose={onClose}
        onChange={(v) => setHowWeMet(person.id, v)}
      />
      <PersonTextSheet
        visible={sheet === 'notes'}
        title={t('person.notesLabel')}
        value={person.notes}
        placeholder={t('person.notesPlaceholder')}
        multiline
        onClose={onClose}
        onChange={(v) => setNotes(person.id, v)}
      />
      <DatesSheet
        visible={sheet === 'dates'}
        birthday={getBirthday(person)}
        otherDates={otherImportantDates(person)}
        onClose={onClose}
        onSetBirthday={(month, day) => setBirthday(person.id, month, day)}
        onClearBirthday={() => clearBirthday(person.id)}
        onAdd={(label, month, day) =>
          // A "birthday" typed into the generic add is the canonical birthday, not
          // a second date — route it so there's only ever one.
          isBirthday({ id: '', label, month, day })
            ? setBirthday(person.id, month, day)
            : addImportantDate(person.id, label, month, day)
        }
        onRemove={(id) => removeImportantDate(person.id, id)}
      />
      <PrefsSheet
        visible={sheet === 'prefs'}
        preferences={person.preferences}
        onClose={onClose}
        onAdd={(kind, text) => addPreference(person.id, kind, text)}
        onRemove={(id) => removePreference(person.id, id)}
      />
      <PersonalitySheet
        visible={sheet === 'personality'}
        person={person}
        onClose={onClose}
        onPick={(framework, value) => setPersonalityType(person.id, framework, value)}
      />
    </>
  );
}

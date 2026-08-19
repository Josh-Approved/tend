/**
 * Component test — the personality chips are speakable, and their selected state
 * is not carried by colour alone.
 *
 * Two claims meet on this sheet. The Enneagram chips print a bare numeral ("1")
 * but were labelled with the long form ("Type 1 · The Improver"), so a Voice
 * Control user could read "1" off the chip and had no way to say it. And the
 * selection is a filled pill, which greyscale flattens — so the state has to
 * reach a colour-blind user through `accessibilityState` and the weight change,
 * not the fill.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { makePerson, type Person } from '../../data/person';
import { PersonalitySheet } from '../PersonalitySheet';

function withPersonality(value: string): Person {
  const p = makePerson('Ada');
  return { ...p, personalityTypes: [{ framework: 'enneagram', value }] };
}

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderSheet(person: Person, onPick: jest.Mock = jest.fn()) {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PersonalitySheet visible person={person} onPick={onPick} onClose={jest.fn()} />
    </SafeAreaProvider>
  );
}

describe('PersonalitySheet chips', () => {
  it('names each chip with the text printed on it', async () => {
    await renderSheet(makePerson('Ada'));

    // "1" is what the chip says, so "1" is what it must answer to.
    const chip = screen.getByRole('button', { name: '1' });
    expect(chip).toBeTruthy();
    // The long form still reaches VoiceOver, through the hint Voice Control skips.
    expect(chip.props.accessibilityHint).toBe('Type 1 · The Improver');
  });

  it('leaves the attachment chips unhinted, where the short and long forms agree', async () => {
    await renderSheet(makePerson('Ada'));

    const secure = screen.getByRole('button', { name: 'Secure' });
    expect(secure.props.accessibilityHint).toBeUndefined();
  });

  it('records the chip that was pressed, against its own framework', async () => {
    const onPick = jest.fn();
    const user = userEvent.setup({ delay: 0 });
    await renderSheet(makePerson('Ada'), onPick);

    await user.press(screen.getByRole('button', { name: '4' }));

    expect(onPick).toHaveBeenCalledWith('enneagram', '4');
  });

  it('clears the value when the chip already selected is pressed again', async () => {
    const onPick = jest.fn();
    const user = userEvent.setup({ delay: 0 });
    await renderSheet(withPersonality('4'), onPick);

    // Nothing here is required, so a mis-tap has to be undoable by tapping the
    // same chip — without that, a wrong pick is permanent.
    await user.press(screen.getByRole('button', { name: '4' }));

    expect(onPick).toHaveBeenCalledWith('enneagram', null);
  });

  it('announces which chip is selected rather than only filling it', async () => {
    await renderSheet(withPersonality('4'));

    expect(screen.getByRole('button', { name: '4' }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByRole('button', { name: '5' }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });
});

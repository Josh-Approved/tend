/**
 * Component test — the Have the Conversation onboarding card.
 *
 * A first-run full-screen modal is the classic dead-end shape: if the one
 * dismiss control is unreachable there is no way out of the tab. So the test
 * asserts the way out exists, is named, and actually closes.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// The card's own <SafeAreaProvider> (it is a full-screen Modal, so it needs one)
// renders nothing until insets resolve, which under jest only happens from a
// parent carrying metrics. Wrapping supplies them; the component is untouched.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { HTCIntro } from '../HTCIntro';

async function renderIntro(visible: boolean, onClose = jest.fn()) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <HTCIntro visible={visible} onClose={onClose} />
    </SafeAreaProvider>
  );
  return onClose;
}

describe('HTCIntro', () => {
  it('closes from its one dismiss control', async () => {
    const user = userEvent.setup({ delay: 0 });

    const onClose = await renderIntro(true);

    // The intro explains the idea...
    expect(screen.getByText('Have the conversation')).toBeTruthy();
    // ...and hands back a labelled way out.
    await user.press(screen.getByRole('button', { name: 'Got it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows nothing while hidden', async () => {
    await renderIntro(false);

    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
  });
});

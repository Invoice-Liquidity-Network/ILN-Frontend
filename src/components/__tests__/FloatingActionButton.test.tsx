import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import FloatingActionButton from '../FloatingActionButton';

// Control the quick-submit state without importing the real (JSX-in-.ts)
// provider, so the FAB can be unit-tested in isolation.
let mockOpen = false;
const openQuickSubmit = vi.fn(() => {
  mockOpen = true;
});
const closeQuickSubmit = vi.fn(() => {
  mockOpen = false;
});

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => ({
    isQuickSubmitOpen: mockOpen,
    openQuickSubmit,
    closeQuickSubmit,
  }),
}));

beforeEach(() => {
  mockOpen = false;
  openQuickSubmit.mockClear();
  closeQuickSubmit.mockClear();
});

const getFab = () => screen.getByRole('button', { name: /quick submit invoice/i });

describe('FloatingActionButton (#309)', () => {
  it('is a focusable button with an accessible name', () => {
    render(<FloatingActionButton />);
    const fab = getFab();
    expect(fab).toHaveAttribute('type', 'button');
    expect(fab).toHaveAttribute('tabindex', '0');
    expect(fab).toHaveAttribute('aria-haspopup', 'dialog');
    fab.focus();
    expect(fab).toHaveFocus();
  });

  it('activates with Enter', async () => {
    const user = userEvent.setup();
    render(<FloatingActionButton />);
    getFab().focus();
    await user.keyboard('{Enter}');
    expect(openQuickSubmit).toHaveBeenCalledTimes(1);
  });

  it('activates with Space', async () => {
    const user = userEvent.setup();
    render(<FloatingActionButton />);
    getFab().focus();
    await user.keyboard(' ');
    expect(openQuickSubmit).toHaveBeenCalledTimes(1);
  });

  it('reflects the open state via aria-expanded', () => {
    const { rerender } = render(<FloatingActionButton />);
    expect(getFab()).toHaveAttribute('aria-expanded', 'false');

    mockOpen = true;
    rerender(<FloatingActionButton />);
    expect(getFab()).toHaveAttribute('aria-expanded', 'true');
  });

  it('returns focus to the FAB after the drawer closes', async () => {
    // Start with the drawer open and focus parked elsewhere (as it would be
    // inside the open drawer).
    mockOpen = true;
    const { rerender } = render(
      <>
        <FloatingActionButton />
        <button type="button">elsewhere</button>
      </>
    );
    screen.getByRole('button', { name: /elsewhere/i }).focus();

    // Close the drawer: focus should return to the FAB.
    mockOpen = false;
    rerender(
      <>
        <FloatingActionButton />
        <button type="button">elsewhere</button>
      </>
    );

    await waitFor(() => expect(getFab()).toHaveFocus());
  });
});

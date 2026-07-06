import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useMediaQuery from '../useMediaQuery';

type Listener = (e: { matches: boolean }) => void;

function mockMatchMedia(initialMatches: boolean) {
  let listener: Listener | null = null;
  const mql = {
    matches: initialMatches,
    media: '',
    addEventListener: vi.fn((_: string, cb: Listener) => {
      listener = cb;
    }),
    removeEventListener: vi.fn(() => {
      listener = null;
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      mql.media = query;
      return mql;
    }),
  });
  return {
    emit: (matches: boolean) => {
      mql.matches = matches;
      act(() => listener?.({ matches }));
    },
  };
}

describe('useMediaQuery', () => {
  const original = window.matchMedia;
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: original,
    });
  });

  it('returns the initial match state', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(false);
  });

  it('updates when the media query changes', () => {
    const { emit } = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(result.current).toBe(false);
    emit(true);
    expect(result.current).toBe(true);
  });
});

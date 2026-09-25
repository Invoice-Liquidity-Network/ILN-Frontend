/**
 * Tests for src/lib/contract-event-stream-state.ts
 * Covers the streaming state toggle functions.
 */
import { describe, it, expect } from 'vitest';
import {
  setContractEventStreamingActive,
  isContractEventStreamingActive,
} from '@/lib/contract-event-stream-state';

describe('contract-event-stream-state', () => {
  it('defaults to false', () => {
    // Reset to known state
    setContractEventStreamingActive(false);
    expect(isContractEventStreamingActive()).toBe(false);
  });

  it('returns true after being set to true', () => {
    setContractEventStreamingActive(true);
    expect(isContractEventStreamingActive()).toBe(true);
  });

  it('returns false after being toggled back off', () => {
    setContractEventStreamingActive(true);
    setContractEventStreamingActive(false);
    expect(isContractEventStreamingActive()).toBe(false);
  });

  it('handles rapid toggling correctly', () => {
    setContractEventStreamingActive(true);
    setContractEventStreamingActive(false);
    setContractEventStreamingActive(true);
    expect(isContractEventStreamingActive()).toBe(true);
  });
});

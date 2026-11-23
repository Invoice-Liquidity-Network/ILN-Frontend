import { afterEach, describe, expect, it } from 'vitest';
import {
  applyReferralAttribution,
  createReferralAttributionLedger,
  generateReferralCode,
  getReferralLink,
  isValidReferralCode,
  normalizeReferralCode,
  type ReferralCodeRecord,
} from '../referrals';

describe('generateReferralCode', () => {
  it('returns an empty string for an empty address', async () => {
    expect(await generateReferralCode('')).toBe('');
  });

  it('generates an 8-character uppercase hex code deterministically for the same address', async () => {
    const a = await generateReferralCode('GADDRESS1');
    const b = await generateReferralCode('GADDRESS1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9A-F]{8}$/);
  });

  it('generates different codes for different addresses', async () => {
    const a = await generateReferralCode('GADDRESS1');
    const b = await generateReferralCode('GADDRESS2');
    expect(a).not.toBe(b);
  });
});

describe('getReferralLink', () => {
  afterEach(() => {
    (global as any).window = window;
  });

  it('builds a link using window.location.origin', () => {
    expect(getReferralLink('ABCD1234')).toBe(`${window.location.origin}/submit?ref=ABCD1234`);
  });

  it('falls back to a relative path when window is undefined', () => {
    const originalWindow = global.window;
    // @ts-expect-error simulating an SSR environment
    delete global.window;
    expect(getReferralLink('ABCD1234')).toBe('/submit?ref=ABCD1234');
    global.window = originalWindow;
  });

  it('returns empty string for blank codes and URL-encodes special characters', () => {
    expect(getReferralLink('   ')).toBe('');
    expect(getReferralLink('ABCD&evil=1')).toBe(
      `${window.location.origin}/submit?ref=ABCD%26evil%3D1`
    );
  });
});

describe('referral code normalization and attribution safety', () => {
  const registry: Record<string, ReferralCodeRecord> = {
    AAAA1111: { code: 'AAAA1111', referrerAddress: 'GREFERRER_A' },
    BBBB2222: { code: 'BBBB2222', referrerAddress: 'GREFERRER_B' },
    EXP12345: { code: 'EXP12345', referrerAddress: 'GREFERRER_A', expiresAt: 1_000 },
    REV12345: { code: 'REV12345', referrerAddress: 'GREFERRER_A', revoked: true },
  };

  it('normalizes and validates 8-character uppercase hex codes', () => {
    expect(normalizeReferralCode('  aaaa1111 ')).toBe('AAAA1111');
    expect(isValidReferralCode('abcd1234')).toBe(true);
    expect(isValidReferralCode('TOO_SHORT')).toBe(false);
    expect(isValidReferralCode('ZZZZ1111')).toBe(false);
  });

  it('rejects replayed event IDs without mutating rewards', () => {
    const initial = createReferralAttributionLedger();
    const first = applyReferralAttribution(
      initial,
      {
        eventId: 'tx1:0',
        type: 'join',
        code: 'aaaa1111',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 25,
      },
      registry,
      500
    );
    expect(first.accepted).toBe(true);

    const replay = applyReferralAttribution(
      first.ledger,
      {
        eventId: 'tx1:0',
        type: 'join',
        code: 'AAAA1111',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 25,
      },
      registry,
      501
    );
    expect(replay.accepted).toBe(false);
    if (!replay.accepted) {
      expect(replay.reason).toBe('replayed_event');
    }
    expect(replay.ledger.rewardsByReferrer['GREFERRER_A']).toBe(25);
  });

  it('rejects duplicate joins and conflicting attribution attempts', () => {
    const first = applyReferralAttribution(
      createReferralAttributionLedger(),
      {
        eventId: 'join-1',
        type: 'join',
        code: 'AAAA1111',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 10,
      },
      registry,
      500
    );
    expect(first.accepted).toBe(true);

    const dupJoin = applyReferralAttribution(
      first.ledger,
      {
        eventId: 'join-2',
        type: 'join',
        code: 'AAAA1111',
        refereeAddress: 'greferee_1',
        rewardAmount: 10,
      },
      registry,
      501
    );
    expect(dupJoin.accepted).toBe(false);
    if (!dupJoin.accepted) expect(dupJoin.reason).toBe('duplicate_join');

    const conflict = applyReferralAttribution(
      first.ledger,
      {
        eventId: 'reward-conflict',
        type: 'reward',
        code: 'BBBB2222',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 50,
      },
      registry,
      502
    );
    expect(conflict.accepted).toBe(false);
    if (!conflict.accepted) expect(conflict.reason).toBe('duplicate_join_conflict');
    expect(conflict.ledger.rewardsByReferrer['GREFERRER_B']).toBeUndefined();
    expect(conflict.ledger.rewardsByReferrer['GREFERRER_A']).toBe(10);
  });

  it('rejects expired, revoked, invalid, and self-referral codes without mutating rewards', () => {
    const ledger = createReferralAttributionLedger();

    const expired = applyReferralAttribution(
      ledger,
      {
        eventId: 'e-exp',
        type: 'join',
        code: 'EXP12345',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 10,
      },
      registry,
      2_000
    );
    expect(expired.accepted).toBe(false);
    if (!expired.accepted) expect(expired.reason).toBe('expired_code');

    const revoked = applyReferralAttribution(
      ledger,
      {
        eventId: 'e-rev',
        type: 'join',
        code: 'REV12345',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 10,
      },
      registry,
      500
    );
    expect(revoked.accepted).toBe(false);
    if (!revoked.accepted) expect(revoked.reason).toBe('revoked_code');

    const invalid = applyReferralAttribution(
      ledger,
      {
        eventId: 'e-inv',
        type: 'join',
        code: 'DEAD9999',
        refereeAddress: 'GREFEREE_1',
        rewardAmount: 10,
      },
      registry,
      500
    );
    expect(invalid.accepted).toBe(false);
    if (!invalid.accepted) expect(invalid.reason).toBe('invalid_code');

    const selfRef = applyReferralAttribution(
      ledger,
      {
        eventId: 'e-self',
        type: 'join',
        code: 'AAAA1111',
        refereeAddress: ' greferrer_a ',
        rewardAmount: 10,
      },
      registry,
      500
    );
    expect(selfRef.accepted).toBe(false);
    if (!selfRef.accepted) expect(selfRef.reason).toBe('self_referral');
    expect(ledger.rewardsByReferrer).toEqual({});
  });
});

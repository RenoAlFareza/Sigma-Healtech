import { describe, it, expect } from 'vitest';
import { fefoPick } from './fefo';

const lots = [
  { lot: 'L-LATE', expiry: '2028-01-01', qtyOnHand: 100, bin: 'Z-A1' },
  { lot: 'L-EARLY', expiry: '2027-09-01', qtyOnHand: 30, bin: 'Z-B2' },
  { lot: 'L-NOEXP', expiry: null, qtyOnHand: 20, bin: 'Z-C3' },
];

describe('fefoPick (earliest expiry first)', () => {
  it('picks from earliest expiry first', () => {
    const res = fefoPick(lots, 40);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // EARLY (expiry 2026) consumed first (30), then 10 from LATE (2028).
      expect(res.picks[0].lot).toBe('L-EARLY');
      expect(res.picks[0].qty).toBe(30);
      expect(res.picks[1].lot).toBe('L-LATE');
      expect(res.picks[1].qty).toBe(10);
    }
  });

  it('treats lots without expiry last (never prioritised)', () => {
    const res = fefoPick([{ lot: 'A', expiry: null, qtyOnHand: 5, bin: 'X' }, { lot: 'B', expiry: '2027-01-01', qtyOnHand: 5, bin: 'Y' }], 10);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.picks[0].lot).toBe('B');
      expect(res.picks[1].lot).toBe('A');
    }
  });

  it('fails when total stock is insufficient', () => {
    const res = fefoPick(lots, 9999);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/insufficient/i);
  });

  it('splits across multiple lots', () => {
    const res = fefoPick(lots, 55);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const total = res.picks.reduce((s, p) => s + p.qty, 0);
      expect(total).toBe(55);
    }
  });

  it('EXCLUDES expired lots from the FEFO source (medical policy)', () => {
    const now = new Date('2026-08-09T00:00:00Z');
    const expired = [
      { lot: 'L-EXPIRED', expiry: '2026-01-01', qtyOnHand: 100, bin: 'Z-A1' }, // expired before now
      { lot: 'L-VALID1', expiry: '2027-01-01', qtyOnHand: 10, bin: 'Z-A2' },
      { lot: 'L-VALID2', expiry: '2027-06-01', qtyOnHand: 10, bin: 'Z-A3' },
    ];
    const res = fefoPick(expired, 20, now);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Only valid lots picked, never the expired one.
      for (const p of res.picks) {
        expect(p.lot).not.toBe('L-EXPIRED');
      }
      const pickedLot = res.picks.map((p) => p.lot);
      expect(pickedLot).toEqual(['L-VALID1', 'L-VALID2']);
    }
  });

  it('fails when only expired lots are available (nothing safe to pick)', () => {
    const now = new Date('2026-08-09T00:00:00Z');
    const allExpired = [
      { lot: 'L-EXPIRED1', expiry: '2026-01-01', qtyOnHand: 100, bin: 'Z-A1' },
    ];
    const res = fefoPick(allExpired, 5, now);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/insufficient|Insufficient/i);
  });
});
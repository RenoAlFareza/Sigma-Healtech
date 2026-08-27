import { describe, it, expect } from 'vitest';
import { getStockStatus } from './stockStatus';

// Fixed "today" reference so tests are deterministic.
const TODAY = new Date('2026-08-08T12:00:00Z');

function daysFromToday(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe('getStockStatus', () => {
  it('returns IN_STOCK when qty is above reorder point and clearly within expiry', () => {
    expect(
      getStockStatus({ qtyOnHand: 50, expiry: daysFromToday(300) }, { reorderPoint: 10 }, TODAY)
    ).toBe('IN_STOCK');
  });

  it('returns LOW_STOCK when qty is at or below reorder point but above zero', () => {
    expect(
      getStockStatus({ qtyOnHand: 10, expiry: daysFromToday(300) }, { reorderPoint: 10 }, TODAY)
    ).toBe('LOW_STOCK');
    expect(
      getStockStatus({ qtyOnHand: 5, expiry: daysFromToday(300) }, { reorderPoint: 10 }, TODAY)
    ).toBe('LOW_STOCK');
  });

  it('returns STOCKOUT when qty is zero or negative', () => {
    expect(
      getStockStatus({ qtyOnHand: 0, expiry: daysFromToday(300) }, { reorderPoint: 10 }, TODAY)
    ).toBe('STOCKOUT');
    expect(
      getStockStatus({ qtyOnHand: -2, expiry: daysFromToday(300) }, { reorderPoint: 10 }, TODAY)
    ).toBe('STOCKOUT');
  });

  it('returns EXPIRING when expiry is within 30 days', () => {
    expect(
      getStockStatus({ qtyOnHand: 50, expiry: daysFromToday(15) }, { reorderPoint: 10 }, TODAY)
    ).toBe('EXPIRING');
    expect(
      getStockStatus({ qtyOnHand: 50, expiry: daysFromToday(30) }, { reorderPoint: 10 }, TODAY)
    ).toBe('EXPIRING');
  });

  it('returns EXPIRED when expiry is in the past', () => {
    expect(
      getStockStatus({ qtyOnHand: 50, expiry: daysFromToday(-1) }, { reorderPoint: 10 }, TODAY)
    ).toBe('EXPIRED');
  });

  it('prioritises expiry over low-quantity statuses', () => {
    // QoH > reorderPoint but expiring.
    expect(
      getStockStatus({ qtyOnHand: 50, expiry: daysFromToday(10) }, { reorderPoint: 10 }, TODAY)
    ).toBe('EXPIRING');
  });

  it('uses default reorder point of 10 when config is omitted', () => {
    expect(getStockStatus({ qtyOnHand: 5, expiry: daysFromToday(300) }, undefined, TODAY)).toBe(
      'LOW_STOCK'
    );
    expect(getStockStatus({ qtyOnHand: 20, expiry: daysFromToday(300) }, undefined, TODAY)).toBe(
      'IN_STOCK'
    );
  });

  it('treats missing/given expiry as valid unless it is provided', () => {
    expect(getStockStatus({ qtyOnHand: 20 }, undefined, TODAY)).toBe('IN_STOCK');
  });
});
import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetStock,
  getStockForLocation,
  getStockItem,
  decrementStock,
  incrementStock,
  getLedger,
  resetLedger,
} from '@/api/_fixtures/inventory';

describe('stock engine mutations', () => {
  beforeEach(() => {
    resetStock();
    resetLedger();
  });

  it('decrements qtyOnHand for an existing lot', () => {
    const res = decrementStock('wh-pusat', '93000462', 'LOT-2026-001', 10);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.item.qtyOnHand).toBe(110); // 120 - 10
    }
  });

  it('rejects a decrement that exceeds available stock', () => {
    const res = decrementStock('wh-pusat', '93000462', 'LOT-2026-001', 9999);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/insufficient|tidak cukup/i);
  });

  it('rejects a decrement when no matching lot exists', () => {
    const res = decrementStock('wh-pusat', '93000462', 'NOPE-LOT', 5);
    expect(res.ok).toBe(false);
  });

  it('increments an existing lot by adding to qtyOnHand', () => {
    const before = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;
    incrementStock('wh-pusat', '93000462', { lot: 'LOT-2026-001', bin: 'Z-A1', qty: 25 });
    const after = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;
    expect(after).toBe(before + 25);
  });

  it('creates a new lot row when incrementing an unknown lot', () => {
    incrementStock('wh-pusat', '93000462', { lot: 'LOT-NEW-999', bin: 'Z-A9', qty: 5, expiry: '2028-01-01' });
    const found = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-NEW-999');
    expect(found).toBeDefined();
    expect(found!.qtyOnHand).toBe(5);
    expect(found!.bin).toBe('Z-A9');
  });

  it('records IN and OUT ledger entries with running balance', () => {
    // wh-pusat LOT-2026-001 starts at 120.
    decrementStock('wh-pusat', '93000462', 'LOT-2026-001', 20, 'usr-staff');
    // getStockForLocation to fetch item id/lot for the OUT entry
    const outEntry = getLedger('wh-pusat', '93000462').find((t) => t.type === 'OUT');
    expect(outEntry).toBeDefined();
    expect(outEntry!.qtyOut).toBe(20);
    expect(outEntry!.balance).toBe(100);

    incrementStock('wh-pusat', '93000462', { lot: 'LOT-2026-001', qty: 30, bin: 'Z-A1' });
    const ledger = getLedger('wh-pusat', '93000462');
    const inEntry = ledger.find((t) => t.type === 'IN');
    expect(inEntry).toBeDefined();
    expect(inEntry!.qtyIn).toBe(30);
    expect(inEntry!.balance).toBe(130);
    // Balances are cumulative/chronological.
    expect(ledger[ledger.length - 1].balance).toBe(130);
  });
});
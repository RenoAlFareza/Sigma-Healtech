import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetReceipts,
  createReceipt,
  getReceiptById,
  commitReceipt,
  listReceipts,
} from '@/api/_fixtures/inbound';
import { resetStock, resetLedger, getStockItem, getLedger } from '@/api/_fixtures/inventory';

describe('inbound store', () => {
  beforeEach(() => {
    resetReceipts();
    resetStock();
    resetLedger();
  });

  it('creates a receipt in CREATED status', () => {
    const r = createReceipt({
      sourceType: 'SUPPLIER',
      items: [{ productId: '93000462', qtyExpected: 50, lot: 'LOT-ABC', expiry: '2028-01-01', bin: '' }],
    });
    expect(r.status).toBe('CREATED');
    expect(r.receiptNumber).toMatch(/^IN-2026-/);
  });

  it('commit credits stock and records IN ledger', () => {
    const r = createReceipt({
      sourceType: 'SUPPLIER',
      items: [{ productId: '93000462', qtyExpected: 50, lot: 'LOT-ABC', expiry: '2028-01-01', bin: 'Z-A1' }],
    });
    const before = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-ABC');
    expect(before).toBeUndefined();

    const res = commitReceipt(r.id, { destLocationId: 'wh-pusat', receivedBy: 'usr-staff', items: [{ productId: '93000462', qtyExpected: 50, qtyReceived: 50, lot: 'LOT-ABC', expiry: '2028-01-01', bin: 'Z-A1' }] });
    expect(res.ok).toBe(true);

    const after = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-ABC');
    expect(after?.qtyOnHand).toBe(50);
    const ins = getLedger('wh-pusat', '93000462').filter((t) => t.type === 'IN');
    expect(ins.reduce((s, t) => s + (t.qtyIn ?? 0), 0)).toBe(50);
  });

  it('allows partial receipt (qtyReceived < qtyExpected)', () => {
    const r = createReceipt({
      sourceType: 'SUPPLIER',
      items: [{ productId: '93000462', qtyExpected: 100, lot: 'LOT-PART', expiry: '2028-01-01', bin: '' }],
    });
    const res = commitReceipt(r.id, {
      destLocationId: 'wh-pusat',
      receivedBy: 'usr-staff',
      items: [{ productId: '93000462', qtyExpected: 100, qtyReceived: 40, lot: 'LOT-PART', expiry: '2028-01-01', bin: 'Z-A1' }],
    });
    expect(res.ok).toBe(true);
    const found = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-PART');
    expect(found?.qtyOnHand).toBe(40);
  });

  it('rejects commit when lot or expiry is missing', () => {
    const r = createReceipt({
      sourceType: 'SUPPLIER',
      items: [{ productId: '93000462', qtyExpected: 50 }],
    });
    const res = commitReceipt(r.id, {
      destLocationId: 'wh-pusat',
      items: [{ productId: '93000462', qtyExpected: 50, qtyReceived: 50 }], // no lot/expiry
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/lot and expiry/i);
  });

  it('marks receipt COMPLETED after commit', () => {
    const r = createReceipt({
      sourceType: 'SUPPLIER',
      items: [{ productId: '93000462', qtyExpected: 10, lot: 'LOT-DONE', expiry: '2028-01-01', bin: '' }],
    });
    commitReceipt(r.id, {
      destLocationId: 'wh-pusat',
      receivedBy: 'usr-staff',
      items: [{ productId: '93000462', qtyExpected: 10, qtyReceived: 10, lot: 'LOT-DONE', expiry: '2028-01-01', bin: '' }],
    });
    const stored = getReceiptById(r.id);
    expect(stored?.status).toBe('COMPLETED');
  });

  it('lists receipts with status filter', () => {
    expect(listReceipts({ status: 'CREATED' }).length).toBeGreaterThan(0);
  });
});
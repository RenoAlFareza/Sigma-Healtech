import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetPOs,
  createPO,
  getPOById,
  updatePOStatus,
  recordPOReceipt,
  listPOs,
  allowedPOTransition,
} from '@/api/_fixtures/procurement';

describe('procurement store', () => {
  beforeEach(() => resetPOs());

  it('creates a PO in PENDING and computes total', () => {
    const res = createPO({
      supplierName: 'Kimia Farma',
      items: [
        { productId: '93000462', qty: 100, unitPrice: 5000, qtyReceived: 0 },
        { productId: '93012826', qty: 50, unitPrice: 3000, qtyReceived: 0 },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.po.status).toBe('PENDING');
      expect(res.po.poNumber).toMatch(/^PO-2026-/);
      expect(res.po.total).toBe(100 * 5000 + 50 * 3000);
    }
  });

  it('rejects create when product not in catalog', () => {
    const res = createPO({
      supplierName: 'X',
      items: [{ productId: 'DOES-NOT-EXIST', qty: 10, unitPrice: 100, qtyReceived: 0 }],
    });
    expect(res.ok).toBe(false);
  });

  it('approves and places in sequence', () => {
    const res = createPO({ supplierName: 'X', items: [{ productId: '93000462', qty: 10, unitPrice: 100, qtyReceived: 0 }] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(updatePOStatus(res.po.id, 'APPROVED').ok).toBe(true);
    expect(updatePOStatus(res.po.id, 'PLACED').ok).toBe(true);
  });

  it('rejects illegal transition PENDING → RECEIVED', () => {
    const res = createPO({ supplierName: 'X', items: [{ productId: '93000462', qty: 10, unitPrice: 100, qtyReceived: 0 }] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(allowedPOTransition('PENDING', 'RECEIVED')).toBe(false);
    expect(updatePOStatus(res.po.id, 'RECEIVED').ok).toBe(false);
  });

  it('records partial receipt → PARTIALLY_RECEIVED', () => {
    const res = createPO({ supplierName: 'X', items: [{ productId: '93000462', qty: 100, unitPrice: 100, qtyReceived: 0 }] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const po = res.po;
    const rec = recordPOReceipt(po.id, [{ productId: '93000462', qtyReceived: 40 }]);
    expect(rec.ok).toBe(true);
    const stored = getPOById(po.id);
    expect(stored?.status).toBe('PARTIALLY_RECEIVED');
    expect(stored?.items[0].qtyReceived).toBe(40);
  });

  it('records full receipt → RECEIVED', () => {
    const res = createPO({ supplierName: 'X', items: [{ productId: '93000462', qty: 100, unitPrice: 100, qtyReceived: 0 }] });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const po = res.po;
    const rec = recordPOReceipt(po.id, [{ productId: '93000462', qtyReceived: 100 }]);
    expect(rec.ok).toBe(true);
    expect(getPOById(po.id)?.status).toBe('RECEIVED');
  });

  it('lists POs with status filter', () => {
    createPO({ supplierName: 'X', items: [{ productId: '93000462', qty: 10, unitPrice: 100, qtyReceived: 0 }] });
    expect(listPOs({ status: 'PENDING' }).length).toBeGreaterThan(0);
  });
});
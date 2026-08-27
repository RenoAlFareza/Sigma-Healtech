import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetTransfers,
  createTransfer,
  getTransferById,
  updateTransferStatus,
  completeTransfer,
  listTransfers,
} from '@/api/_fixtures/transfers';
import {
  resetStock,
  resetLedger,
  getStockForLocation,
  getStockItem,
  getLedger,
} from '@/api/_fixtures/inventory';

describe('transfers store', () => {
  beforeEach(() => {
    resetTransfers();
    resetStock();
    resetLedger();
  });

  it('creates a transfer in DRAFT and approves it', () => {
    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
    });
    expect(t.status).toBe('DRAFT');
    expect(updateTransferStatus(t.id, 'APPROVED').ok).toBe(true);
  });

  it('rejects illegal transitions', () => {
    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
    });
    expect(updateTransferStatus(t.id, 'COMPLETED').ok).toBe(false); // DRAFT → COMPLETED
  });

  it('complete moves stock origin → destination atomically', () => {
    const originBefore = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462' && i.lot === 'LOT-2026-001')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    const destLotBefore = getStockItem('93000462', 'depo-rawat-inap').find((i) => i.lot === 'LOT-2026-001');

    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
    });
    updateTransferStatus(t.id, 'APPROVED');
    const res = completeTransfer(t.id, 'usr-staff');
    expect(res.ok).toBe(true);

    // Origin decreased by 10, destination has the new lot with 10.
    const originAfter = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462' && i.lot === 'LOT-2026-001')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    expect(originAfter).toBe(originBefore - 10);

    const destLotAfter = getStockItem('93000462', 'depo-rawat-inap').find((i) => i.lot === 'LOT-2026-001');
    expect(destLotAfter?.qtyOnHand).toBe((destLotBefore?.qtyOnHand ?? 0) + 10);
  });

  it('records TRANSFER_OUT and TRANSFER_IN ledger entries', () => {
    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
    });
    updateTransferStatus(t.id, 'APPROVED');
    completeTransfer(t.id, 'usr-staff');

    const out = getLedger('wh-pusat', '93000462').filter((x) => x.type === 'TRANSFER_OUT');
    const inn = getLedger('depo-rawat-inap', '93000462').filter((x) => x.type === 'TRANSFER_IN');
    expect(out.reduce((s, x) => s + (x.qtyOut ?? 0), 0)).toBe(10);
    expect(inn.reduce((s, x) => s + (x.qtyIn ?? 0), 0)).toBe(10);
  });

  it('blocks complete when origin stock is insufficient', () => {
    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 99999 }],
    });
    updateTransferStatus(t.id, 'APPROVED');
    const res = completeTransfer(t.id, 'usr-staff');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/insufficient|Insufficient/i);
  });

  it('lists transfers with status filter', () => {
    expect(listTransfers({ status: 'APPROVED' }).length).toBeGreaterThan(0);
  });

  it('is atomic: a Phase-2 destination failure does not partially mutate origin stock', () => {
    const before = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462' && i.lot === 'LOT-2026-001')
      .reduce((s, i) => s + i.qtyOnHand, 0);

    // Destination increment will FAIL because the product id is not in the
    // catalog (and doesn't pre-exist at dest), forcing a Phase-2 failure.
    const t = createTransfer({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      items: [
        { productId: '93000462', lot: 'LOT-2026-001', qty: 10 },
        { productId: 'DOES-NOT-EXIST', lot: 'LOT-X', qty: 5 },
      ],
    });
    updateTransferStatus(t.id, 'APPROVED');
    const res = completeTransfer(t.id, 'usr-staff');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not found/i);

    // Origin qty unchanged (no partial decrement).
    const after = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462' && i.lot === 'LOT-2026-001')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    expect(after).toBe(before);
  });
});
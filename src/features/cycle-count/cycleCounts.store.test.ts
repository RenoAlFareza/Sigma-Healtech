import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetCycleCounts,
  createCycleCount,
  getCycleCountById,
  submitCount,
  resolveCycleCount,
  listCycleCounts,
} from '@/api/_fixtures/cycleCounts';
import {
  resetStock,
  resetLedger,
  getStockForLocation,
  getStockItem,
  getLedger,
} from '@/api/_fixtures/inventory';

describe('cycle count store', () => {
  beforeEach(() => {
    resetCycleCounts();
    resetStock();
    resetLedger();
  });

  it('creates a cycle count from current location stock', () => {
    const res = createCycleCount({ locationId: 'wh-pusat' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.count.status).toBe('IN_PROGRESS');
      expect(res.count.countNumber).toMatch(/^CC-2026-/);
      expect(res.count.items.length).toBeGreaterThan(0);
      // systemQty snapshot equals current on hand for a known lot.
      const para = res.count.items.find((i) => i.productId === '93000462' && i.lot === 'LOT-2026-001');
      expect(para?.systemQty).toBe(120);
    }
  });

  it('filters by category when creating', () => {
    const res = createCycleCount({ locationId: 'wh-pusat', category: 'Antibiotik' });
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Every item must be from the Antibiotik category.
      const allAntibio = res.count.items.every((it) => {
        const stock = getStockItem(it.productId, 'wh-pusat')[0];
        return stock?.product.category === 'Antibiotik';
      });
      expect(allAntibio).toBe(true);
    }
  });

  it('submitCount computes variance = countedQty - systemQty', () => {
    const res = createCycleCount({ locationId: 'wh-pusat' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const id = res.count.id;
    // Paracetamol LOT-2026-001 system 120 → count 115 (variance -5)
    const upd = submitCount(id, [
      { productId: '93000462', lot: 'LOT-2026-001', countedQty: 115 },
    ]);
    expect(upd.ok).toBe(true);
    const stored = getCycleCountById(id);
    const item = stored?.items.find((i) => i.productId === '93000462' && i.lot === 'LOT-2026-001');
    expect(item?.countedQty).toBe(115);
    expect(item?.variance).toBe(-5);
  });

  it('resolve applies ADJUST to stock and records ADJUST ledger', () => {
    const res = createCycleCount({ locationId: 'wh-pusat' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const id = res.count.id;
    // system 120 → count 110 (variance -10, so stock drops by 10)
    submitCount(id, [{ productId: '93000462', lot: 'LOT-2026-001', countedQty: 110 }]);
    const before = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;

    const done = resolveCycleCount(id, { user: 'usr-manager', reasonCodes: { '93000462:LOT-2026-001': 'TIDAK_SESUAI' } });
    expect(done.ok).toBe(true);

    const after = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;
    expect(after).toBe(before - 10); // negative variance removes stock

    const stored = getCycleCountById(id);
    const item = stored?.items.find((i) => i.productId === '93000462' && i.lot === 'LOT-2026-001');
    expect(item?.reasonCode).toBe('TIDAK_SESUAI');
    expect(stored?.status).toBe('COMPLETED');

    const adjusts = getLedger('wh-pusat', '93000462').filter((t) => t.type === 'ADJUST');
    expect(adjusts.reduce((s, t) => s + (t.qtyIn ?? 0) - (t.qtyOut ?? 0), 0)).toBe(-10);
  });

  it('positive variance increments stock', () => {
    const res = createCycleCount({ locationId: 'wh-pusat' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const id = res.count.id;
    // system 120 → count 130 (variance +10)
    submitCount(id, [{ productId: '93000462', lot: 'LOT-2026-001', countedQty: 130 }]);
    const before = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;
    resolveCycleCount(id, { user: 'usr-manager', reasonCodes: {} });
    const after = getStockItem('93000462', 'wh-pusat').find((i) => i.lot === 'LOT-2026-001')!.qtyOnHand;
    expect(after).toBe(before + 10);
  });

  it('rejects resolve when already completed', () => {
    const res = createCycleCount({ locationId: 'wh-pusat' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const id = res.count.id;
    submitCount(id, [{ productId: '93000462', lot: 'LOT-2026-001', countedQty: 120 }]);
    resolveCycleCount(id, { reasonCodes: {} });
    const again = resolveCycleCount(id, { reasonCodes: {} });
    expect(again.ok).toBe(false);
  });

  it('lists cycle counts with status filter', () => {
    createCycleCount({ locationId: 'wh-pusat' });
    expect(listCycleCounts({ status: 'IN_PROGRESS' }).length).toBeGreaterThan(0);
  });
});
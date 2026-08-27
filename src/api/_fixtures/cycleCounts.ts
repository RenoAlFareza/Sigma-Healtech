import { decrementStock, getStockForLocation, incrementStock } from './inventory';
import type { CycleCount, CycleCountItem, CycleCountStatus } from '@/shared/types/domain';

export type CycleCountResult =
  | { ok: true; count: CycleCount }
  | { ok: false; error: string };

let seq = 9000;
let state: CycleCount[] = [];

function makeCountNumber(): string {
  seq += 1;
  return `CC-2026-${String(seq).padStart(4, '0')}`;
}

export function listCycleCounts(filter?: { status?: CycleCountStatus; locationId?: string }): CycleCount[] {
  return state.filter((c) => {
    if (filter?.status && filter.status && c.status !== filter.status) return false;
    if (filter?.locationId && c.locationId !== filter.locationId) return false;
    return true;
  });
}

export function getCycleCountById(id: string): CycleCount | undefined {
  return state.find((c) => c.id === id || c.countNumber === id);
}

/**
 * Create a cycle count from a location's current stock. Optionally filter to a
 * single category. Items snapshot systemQty at creation time.
 */
export function createCycleCount(input: {
  locationId: string;
  category?: string;
}): CycleCountResult {
  const stock = getStockForLocation(input.locationId);
  let items = stock.map<CycleCountItem>((s) => ({
    productId: s.product.id,
    lot: s.lot,
    bin: s.bin,
    systemQty: s.qtyOnHand,
  }));
  if (input.category && input.category !== 'ALL') {
    items = items.filter((it) => {
      const stockItem = stock.find((s) => s.product.id === it.productId && s.lot === it.lot);
      return stockItem?.product.category === input.category;
    });
  }
  if (items.length === 0) {
    return { ok: false, error: 'No stock to count in this location/category' };
  }
  const count: CycleCount = {
    id: `CC-${Date.now().toString(36)}`,
    countNumber: makeCountNumber(),
    locationId: input.locationId,
    status: 'IN_PROGRESS',
    items,
    createdAt: new Date().toISOString(),
  };
  state.unshift(count);
  return { ok: true, count };
}

/**
 * Record counted quantities. variance = countedQty - systemQty (computed here).
 */
export function submitCount(
  id: string,
  entries: { productId: string; lot: string; countedQty: number }[]
): CycleCountResult {
  const count = getCycleCountById(id);
  if (!count) return { ok: false, error: 'Cycle count not found' };
  if (count.status === 'COMPLETED') return { ok: false, error: 'Cycle count already completed' };

  const byKey = new Map(entries.map((e) => [`${e.productId}:${e.lot}`, e.countedQty]));
  count.items = count.items.map((it) => {
    const key = `${it.productId}:${it.lot}`;
    const counted = byKey.has(key) ? (byKey.get(key) as number) : it.systemQty;
    return { ...it, countedQty: counted, variance: counted - it.systemQty };
  });
  count.status = 'RESOLVING';
  return { ok: true, count };
}

/**
 * Resolve a cycle count: for items with non-zero variance, apply an ADJUST to
 * stock (increment if positive, decrement if negative) and record the
 * reasonCode. Items with zero variance are skipped.
 */
export function resolveCycleCount(
  id: string,
  opts: { user?: string; reasonCodes: Record<string, string> }
): CycleCountResult {
  const count = getCycleCountById(id);
  if (!count) return { ok: false, error: 'Cycle count not found' };
  if (count.status === 'COMPLETED') return { ok: false, error: 'Cycle count already completed' };

  for (const it of count.items) {
    const variance = it.variance ?? (it.countedQty ?? it.systemQty) - it.systemQty;
    if (variance === 0) continue;

    const reason = opts.reasonCodes[`${it.productId}:${it.lot}`] || '';
    it.reasonCode = reason;

    // Positive variance → stock is higher than system (counted more) → add.
    // Negative variance → fewer on hand → remove.
    if (variance > 0) {
      const res = incrementStock(count.locationId, it.productId, { lot: it.lot, qty: variance }, opts.user ?? 'system', count.countNumber, 'ADJUST');
      if (!res.ok) return { ok: false, error: res.error };
    } else {
      const res = decrementStock(count.locationId, it.productId, it.lot, -variance, opts.user ?? 'system', count.countNumber, 'ADJUST');
      if (!res.ok) return { ok: false, error: res.error };
    }
  }

  count.status = 'COMPLETED';
  return { ok: true, count };
}

export function resetCycleCounts(): void {
  seq = 9000;
  state = [];
}

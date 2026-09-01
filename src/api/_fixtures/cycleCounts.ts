import { decrementStock, getStockForLocation, incrementStock } from './inventory';
import type { CycleCount, CycleCountItem, CycleCountStatus } from '@/shared/types/domain';

export type CycleCountResult =
  | { ok: true; count: CycleCount }
  | { ok: false; error: string };

let seq = 9000;
let state: CycleCount[] = seedCycleCounts();

function seedCycleCounts(): CycleCount[] {
  return [
    {
      id: 'CC-001',
      countNumber: 'CC-2026-9001',
      locationId: 'wh-pusat',
      status: 'IN_PROGRESS',
      items: [
        { productId: '93000462', lot: 'LOT-2026-001', bin: 'Z-A1', systemQty: 120 },
        { productId: '93000463', lot: 'LOT-2026-002', bin: 'Z-A2', systemQty: 85 },
        { productId: '93000464', lot: 'LOT-2026-003', bin: 'Z-A3', systemQty: 40 },
        { productId: '93012826', lot: 'LOT-2026-004', bin: 'Z-B1', systemQty: 60 },
      ],
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'CC-002',
      countNumber: 'CC-2026-9002',
      locationId: 'wh-pusat',
      status: 'RESOLVING',
      items: [
        { productId: '93000465', lot: 'LOT-2026-005', bin: 'Z-B2', systemQty: 50, countedQty: 48, variance: -2 },
        { productId: '93000466', lot: 'LOT-2026-006', bin: 'Z-B3', systemQty: 100, countedQty: 100, variance: 0 },
        { productId: '93000467', lot: 'LOT-2026-007', bin: 'Z-C1', systemQty: 75, countedQty: 78, variance: 3 },
      ],
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    },
    {
      id: 'CC-003',
      countNumber: 'CC-2026-9003',
      locationId: 'wh-pusat',
      status: 'COMPLETED',
      items: [
        { productId: '93000468', lot: 'LOT-2026-008', bin: 'Z-C2', systemQty: 90, countedQty: 90, variance: 0 },
        { productId: '93000469', lot: 'LOT-2026-009', bin: 'Z-C3', systemQty: 45, countedQty: 43, variance: -2, reasonCode: 'DAMAGED' },
        { productId: '93000470', lot: 'LOT-2026-010', bin: 'Z-D1', systemQty: 30, countedQty: 30, variance: 0 },
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'CC-004',
      countNumber: 'CC-2026-9004',
      locationId: 'depo-igd',
      status: 'COMPLETED',
      items: [
        { productId: '93000462', lot: 'LOT-2026-001', bin: 'IGD-R1', systemQty: 35, countedQty: 35, variance: 0 },
        { productId: '93000466', lot: 'LOT-2026-006', bin: 'IGD-R2', systemQty: 20, countedQty: 19, variance: -1, reasonCode: 'EXPIRATION' },
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'CC-005',
      countNumber: 'CC-2026-9005',
      locationId: 'depo-rawat-inap',
      status: 'COMPLETED',
      items: [
        { productId: '93000463', lot: 'LOT-2026-002', bin: 'RWI-A1', systemQty: 50, countedQty: 50, variance: 0 },
        { productId: '93012826', lot: 'LOT-2026-004', bin: 'RWI-A2', systemQty: 40, countedQty: 40, variance: 0 },
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
  ];
}

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

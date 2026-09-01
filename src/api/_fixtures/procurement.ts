import { getProductById } from './store';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/shared/types/domain';

export type POResult =
  | { ok: true; po: PurchaseOrder }
  | { ok: false; error: string };

export const PO_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  PENDING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['PLACED', 'CANCELLED'],
  PLACED: ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['PARTIALLY_RECEIVED', 'RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

export function allowedPOTransition(from: PurchaseOrderStatus, to: PurchaseOrderStatus): boolean {
  if (from === to) return true;
  return PO_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALL_PO_STATUSES = Object.keys(PO_TRANSITIONS) as PurchaseOrderStatus[];

let seq = 11000;
let state: PurchaseOrder[] = seedPOs();

function seedPOs(): PurchaseOrder[] {
  return [
    {
      id: 'PO-001',
      poNumber: 'PO-2026-11001',
      supplierName: 'PT Kimia Farma Trading & Distribution',
      status: 'APPROVED',
      items: [
        { productId: '93000462', qty: 500, unitPrice: 450, qtyReceived: 0 },
        { productId: '93012826', qty: 200, unitPrice: 1200, qtyReceived: 0 },
        { productId: '93000463', qty: 300, unitPrice: 650, qtyReceived: 0 },
      ],
      total: 660000,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PO-002',
      poNumber: 'PO-2026-11002',
      supplierName: 'PT Kalbe Farma Tbk',
      status: 'PLACED',
      items: [
        { productId: '93000464', qty: 400, unitPrice: 1500, qtyReceived: 0 },
        { productId: '93000465', qty: 150, unitPrice: 850, qtyReceived: 0 },
      ],
      total: 727500,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PO-003',
      poNumber: 'PO-2026-11003',
      supplierName: 'PT Anugrah Argon Medica',
      status: 'PARTIALLY_RECEIVED',
      items: [
        { productId: '93000466', qty: 100, unitPrice: 3500, qtyReceived: 60 },
        { productId: '93000467', qty: 200, unitPrice: 900, qtyReceived: 100 },
      ],
      total: 530000,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PO-004',
      poNumber: 'PO-2026-11004',
      supplierName: 'PT Afifarma Farma',
      status: 'RECEIVED',
      items: [
        { productId: '93000468', qty: 250, unitPrice: 2200, qtyReceived: 250 },
        { productId: '93000469', qty: 300, unitPrice: 750, qtyReceived: 300 },
      ],
      total: 775000,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PO-005',
      poNumber: 'PO-2026-11005',
      supplierName: 'PT Tempo Scan Pacific',
      status: 'PENDING',
      items: [
        { productId: '93000470', qty: 150, unitPrice: 4200, qtyReceived: 0 },
      ],
      total: 630000,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'PO-006',
      poNumber: 'PO-2026-11006',
      supplierName: 'PT Kimia Farma Trading & Distribution',
      status: 'CANCELLED',
      items: [
        { productId: '93000462', qty: 100, unitPrice: 450, qtyReceived: 0 },
      ],
      total: 45000,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
  ];
}

function computeTotal(items: PurchaseOrderItem[]): number {
  return items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
}

function makePoNumber(): string {
  seq += 1;
  return `PO-2026-${String(seq).padStart(4, '0')}`;
}

export function listPOs(filter?: { status?: PurchaseOrderStatus }): PurchaseOrder[] {
  return state.filter((p) => {
    if (filter?.status && filter.status && p.status !== filter.status) return false;
    return true;
  });
}

export function getPOById(id: string): PurchaseOrder | undefined {
  return state.find((p) => p.id === id || p.poNumber === id);
}

export function createPO(input: {
  supplierName: string;
  items: PurchaseOrderItem[];
}): POResult {
  if (input.items.length < 1) return { ok: false, error: 'At least one line item is required' };
  for (const it of input.items) {
    if (!getProductById(it.productId)) return { ok: false, error: `Product ${it.productId} not found` };
    if (it.qty <= 0 || it.unitPrice < 0) return { ok: false, error: `Invalid line for ${it.productId}` };
  }
  const items = input.items.map((it) => ({ ...it, qtyReceived: 0 }));
  const po: PurchaseOrder = {
    id: `PO-${Date.now().toString(36)}`,
    poNumber: makePoNumber(),
    supplierName: input.supplierName,
    status: 'PENDING',
    items,
    total: computeTotal(items),
    createdAt: new Date().toISOString(),
  };
  state.unshift(po);
  return { ok: true, po };
}

export function updatePOStatus(id: string, status: PurchaseOrderStatus, reason?: string): POResult {
  const po = getPOById(id);
  if (!po) return { ok: false, error: 'PO not found' };
  if (po.status === status) return { ok: true, po };
  if (!allowedPOTransition(po.status, status)) {
    return { ok: false, error: `Illegal status transition: ${po.status} → ${status}` };
  }
  po.status = status;
  return { ok: true, po };
}

/**
 * Record a receipt against PO line items. qtyReceived accumulates up to qty.
 * Full receipt → RECEIVED; else PARTIALLY_RECEIVED.
 */
export function recordPOReceipt(
  id: string,
  lines: { productId: string; qtyReceived: number }[]
): POResult {
  const po = getPOById(id);
  if (!po) return { ok: false, error: 'PO not found' };
  if (po.status === 'RECEIVED') return { ok: false, error: 'PO already fully received' };
  if (po.status === 'CANCELLED') return { ok: false, error: 'Cannot receive a cancelled PO' };

  const byProduct = new Map(lines.map((l) => [l.productId, l.qtyReceived]));
  po.items = po.items.map((it) => {
    const received = byProduct.get(it.productId) ?? it.qtyReceived;
    return { ...it, qtyReceived: Math.max(it.qtyReceived, Math.min(received, it.qty)) };
  });

  const allReceived = po.items.every((it) => it.qtyReceived >= it.qty);
  po.status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
  return { ok: true, po };
}

export function resetPOs(): void {
  seq = 11000;
  state = seedPOs();
}

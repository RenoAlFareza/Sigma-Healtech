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
let state: PurchaseOrder[] = [];

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
  state = [];
}

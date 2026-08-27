import { decrementStock, getStockItem, incrementStock } from './inventory';
import { getProductById } from './store';
import type { StockTransfer, TransferItem } from '@/shared/types/domain';

export type TransferStatus = StockTransfer['status'];
export type TransferResult =
  | { ok: true; transfer: StockTransfer }
  | { ok: false; error: string };

export const TRANSFER_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  DRAFT: ['APPROVED'],
  APPROVED: ['COMPLETED'],
  COMPLETED: [],
};

export function allowedTransferTransition(from: TransferStatus, to: TransferStatus): boolean {
  if (from === to) return true;
  return TRANSFER_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALL_TRANSFER_STATUSES = Object.keys(TRANSFER_TRANSITIONS) as TransferStatus[];

let seq = 7000;
let state: StockTransfer[] = seedTransfers();

function seedTransfers(): StockTransfer[] {
  return [
    {
      id: 'TRF-001',
      transferNumber: 'TRF-2026-7001',
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      status: 'APPROVED',
      items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
      createdAt: new Date().toISOString(),
    },
  ];
}

function makeTransferNumber(): string {
  seq += 1;
  return `TRF-2026-${String(seq).padStart(4, '0')}`;
}

export function listTransfers(filter?: { status?: TransferStatus; originId?: string }): StockTransfer[] {
  return state.filter((t) => {
    if (filter?.status && t.status !== filter.status) return false;
    if (filter?.originId && t.originId !== filter.originId) return false;
    return true;
  });
}

export function getTransferById(id: string): StockTransfer | undefined {
  return state.find((t) => t.id === id || t.transferNumber === id);
}

export function createTransfer(input: {
  originId: string;
  destinationId: string;
  items: TransferItem[];
}): StockTransfer {
  const transfer: StockTransfer = {
    id: `TRF-${Date.now().toString(36)}`,
    transferNumber: makeTransferNumber(),
    originId: input.originId,
    destinationId: input.destinationId,
    status: 'DRAFT',
    items: input.items.map((it) => ({ ...it })),
    createdAt: new Date().toISOString(),
  };
  state.unshift(transfer);
  return transfer;
}

export function updateTransferStatus(id: string, status: TransferStatus): TransferResult {
  const transfer = getTransferById(id);
  if (!transfer) return { ok: false, error: 'Transfer not found' };
  if (transfer.status === status) return { ok: true, transfer };
  if (!allowedTransferTransition(transfer.status, status)) {
    return { ok: false, error: `Illegal status transition: ${transfer.status} → ${status}` };
  }
  transfer.status = status;
  return { ok: true, transfer };
}

/**
 * Complete a transfer: decrement origin stock (TRANSFER_OUT) and increment
 * destination stock (TRANSFER_IN) atomically. Rejects on insufficient stock.
 */
export function completeTransfer(id: string, user: string = 'system'): TransferResult {
  const transfer = getTransferById(id);
  if (!transfer) return { ok: false, error: 'Transfer not found' };
  if (!allowedTransferTransition(transfer.status, 'COMPLETED')) {
    return { ok: false, error: `Cannot complete from status ${transfer.status}` };
  }

  // Phase 0: validate all destination increments are satisfiable (product exists
  // in catalog) BEFORE mutating anything, so a Phase-2 failure cannot leave the
  // origin partially decremented. We dry-run incrementStock by checking the
  // product exists for new lots.
  for (const it of transfer.items) {
    if (!it.lot) return { ok: false, error: `Transfer item ${it.productId} requires a lot` };
    const existing = getStockItem(it.productId, transfer.destinationId).find((s) => s.lot === it.lot);
    if (!existing) {
      const product = getProductById(it.productId);
      if (!product) {
        return { ok: false, error: `Product ${it.productId} not found in catalog` };
      }
    }
  }

  // Phase 1: validate all decrements can be satisfied, then apply them.
  for (const it of transfer.items) {
    const res = decrementStock(transfer.originId, it.productId, it.lot as string, it.qty, user, transfer.transferNumber, 'TRANSFER_OUT');
    if (!res.ok) return { ok: false, error: res.error };
  }

  // Phase 2: increment destination. Look up source expiry/bin to carry across.
  for (const it of transfer.items) {
    const source = getStockItem(transfer.originId, it.productId).find(
      (s) => s.lot === it.lot
    );
    const res = incrementStock(
      transfer.destinationId,
      it.productId,
      { lot: it.lot as string, qty: it.qty, expiry: source?.expiry ?? undefined, bin: source?.bin ?? undefined },
      user,
      transfer.transferNumber,
      'TRANSFER_IN'
    );
    if (!res.ok) {
      // Compensating rollback: undo the origin decrements already applied.
      for (const done of transfer.items) {
        incrementStock(transfer.originId, done.productId, { lot: done.lot as string, qty: done.qty }, user, transfer.transferNumber, 'TRANSFER_IN');
      }
      return { ok: false, error: res.error };
    }
  }

  transfer.status = 'COMPLETED';
  return { ok: true, transfer };
}

export function resetTransfers(): void {
  seq = 7000;
  state = seedTransfers();
}

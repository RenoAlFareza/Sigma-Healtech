import { incrementStock } from './inventory';
import type { InboundItem, InboundReceipt, InboundStatus } from '@/shared/types/domain';

export type ReceiptResult =
  | { ok: true; receipt: InboundReceipt }
  | { ok: false; error: string };

let seq = 3000;
let state: InboundReceipt[] = seedReceipts();

function seedReceipts(): InboundReceipt[] {
  return [
    {
      id: 'RCP-001',
      receiptNumber: 'IN-2026-3001',
      sourceType: 'SUPPLIER',
      destinationLocationId: 'wh-pusat',
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      items: [
        { productId: '93000462', qtyExpected: 100, lot: 'LOT-IN-001', expiry: '2028-01-01', bin: '' },
      ],
    },
  ];
}

function makeReceiptNumber(): string {
  seq += 1;
  return `IN-2026-${String(seq).padStart(4, '0')}`;
}

export function listReceipts(filter?: { status?: InboundStatus; destinationLocationId?: string }): InboundReceipt[] {
  return state.filter((r) => {
    if (filter?.status && r.status !== filter.status) return false;
    if (filter?.destinationLocationId && r.destinationLocationId !== filter.destinationLocationId) return false;
    return true;
  });
}

export function getReceiptById(id: string): InboundReceipt | undefined {
  return state.find((r) => r.id === id || r.receiptNumber === id);
}

export function createReceipt(input: {
  sourceType: string;
  referenceId?: string;
  destinationLocationId?: string;
  items: InboundItem[];
}): InboundReceipt {
  const receipt: InboundReceipt = {
    id: `RCP-${Date.now().toString(36)}`,
    receiptNumber: makeReceiptNumber(),
    sourceType: input.sourceType,
    referenceId: input.referenceId,
    destinationLocationId: input.destinationLocationId,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
    items: input.items.map((it) => ({ ...it })),
  };
  state.unshift(receipt);
  return receipt;
}

export function updateReceiptItems(id: string, items: InboundItem[]): ReceiptResult {
  const receipt = getReceiptById(id);
  if (!receipt) return { ok: false, error: 'Receipt not found' };
  receipt.items = items.map((it) => ({ ...it }));
  receipt.status = 'RECEIVING';
  return { ok: true, receipt };
}

/**
 * Commit a receipt: validate every line has lot + expiry, then increment stock
 * (IN ledger) for each line's received quantity into the target location.
 * `destLocationId` is the location receiving the goods.
 */
export function commitReceipt(
  id: string,
  opts: { receivedBy?: string; destLocationId: string; items?: InboundItem[] }
): ReceiptResult {
  const receipt = getReceiptById(id);
  if (!receipt) return { ok: false, error: 'Receipt not found' };
  if (receipt.status === 'COMPLETED') return { ok: false, error: 'Receipt already completed' };
  if (receipt.destinationLocationId && receipt.destinationLocationId !== opts.destLocationId) {
    return { ok: false, error: 'Receipt destination does not match receiving location' };
  }

  const items = opts.items ?? receipt.items;

  // Validate lot + expiry mandatory per line.
  for (const it of items) {
    if (!it.lot || !it.expiry) {
      return { ok: false, error: `Line ${it.productId} requires lot and expiry` };
    }
    const qtyReceived = it.qtyReceived ?? it.qtyExpected;
    if (qtyReceived < 0) return { ok: false, error: 'Received qty cannot be negative' };
  }

  receipt.destinationLocationId = opts.destLocationId;

  for (const it of items) {
    const qtyReceived = it.qtyReceived ?? it.qtyExpected;
    if (qtyReceived > 0) {
      const res = incrementStock(
        opts.destLocationId,
        it.productId,
        { lot: it.lot!, expiry: it.expiry!, bin: it.bin ?? '', qty: qtyReceived },
        opts.receivedBy ?? 'system',
        receipt.receiptNumber
      );
      if (!res.ok) return { ok: false, error: res.error };
    }
  }

  receipt.items = items.map((it) => ({ ...it }));
  receipt.status = 'COMPLETED';
  receipt.receivedAt = new Date().toISOString();
  receipt.receivedBy = opts.receivedBy;
  return { ok: true, receipt };
}

export function resetReceipts(): void {
  seq = 3000;
  state = seedReceipts();
}

import { decrementStock, getStockForLocation, getStockItem } from './inventory';
import { fefoPick } from '@/features/outbound/fefo';
import type { MovementStatus, MovementItem, StockMovement } from '@/shared/types/domain';

export type { MovementStatus };

/**
 * Legal state transitions for an outbound shipment (PRD §7.9).
 */
export const MOVEMENT_TRANSITIONS: Record<MovementStatus, MovementStatus[]> = {
  DRAFT: ['ITEMS'],
  ITEMS: ['PICKING'],
  PICKING: ['PACKED', 'DISPATCHED'],
  PACKED: ['DISPATCHED'],
  DISPATCHED: ['RECEIVED'],
  RECEIVED: [],
};

export function allowedMovementTransition(from: MovementStatus, to: MovementStatus): boolean {
  if (from === to) return true;
  return MOVEMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALL_MOVEMENT_STATUSES = Object.keys(MOVEMENT_TRANSITIONS) as MovementStatus[];

type MovementResult =
  | { ok: true; movement: StockMovement }
  | { ok: false; error: string };

let seq = 5000;
let state: StockMovement[] = seedMovements();

function seedMovements(): StockMovement[] {
  return [
    {
      id: 'MOV-001',
      movementNumber: 'OUT-2026-5001',
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      status: 'PICKING',
      items: [{ productId: '93000462', qty: 20 }],
      createdAt: '2026-08-01T08:00:00Z',
    },
  ];
}

function makeMovementNumber(): string {
  seq += 1;
  return `OUT-2026-${String(seq).padStart(4, '0')}`;
}

export function listMovements(filter?: { status?: MovementStatus; originId?: string }): StockMovement[] {
  return state.filter((m) => {
    if (filter?.status && m.status !== filter.status) return false;
    if (filter?.originId && m.originId !== filter.originId) return false;
    return true;
  });
}

export function getMovementById(id: string): StockMovement | undefined {
  return state.find((m) => m.id === id || m.movementNumber === id);
}

export function createMovement(input: {
  originId: string;
  destinationId: string;
  type: string;
  items: MovementItem[];
}): StockMovement {
  const movement: StockMovement = {
    id: `MOV-${Date.now().toString(36)}`,
    movementNumber: makeMovementNumber(),
    originId: input.originId,
    destinationId: input.destinationId,
    type: input.type,
    status: 'DRAFT',
    items: input.items.map((it) => ({ ...it })),
    createdAt: new Date().toISOString(),
  };
  state.unshift(movement);
  return movement;
}

export function updateMovementStatus(id: string, status: MovementStatus): MovementResult {
  const movement = getMovementById(id);
  if (!movement) return { ok: false, error: 'Movement not found' };
  if (movement.status === status) return { ok: true, movement };
  if (!allowedMovementTransition(movement.status, status)) {
    return { ok: false, error: `Illegal status transition: ${movement.status} → ${status}` };
  }
  movement.status = status;
  return { ok: true, movement };
}

export type DispatchResult =
  | { ok: true; movement: StockMovement }
  | { ok: false; error: string };

/**
 * Apply FEFO picks for each item and decrement the origin stock on dispatch.
 */
export function confirmPick(id: string): DispatchResult {
  const movement = getMovementById(id);
  if (!movement) return { ok: false, error: 'Movement not found' };
  if (!allowedMovementTransition(movement.status, 'PICKING')) {
    return { ok: false, error: `Cannot pick from status ${movement.status}` };
  }
  movement.status = 'PICKING';
  return { ok: true, movement };
}

/**
 * Dispatch: allocate FEFO for each item and decrement origin stock.
 * Rejects when any item is insufficient. On success, records OUT ledger entries.
 */
export function dispatchMovement(id: string, user: string = 'system'): DispatchResult {
  const movement = getMovementById(id);
  if (!movement) return { ok: false, error: 'Movement not found' };
  if (!allowedMovementTransition(movement.status, 'DISPATCHED')) {
    return { ok: false, error: `Cannot dispatch from status ${movement.status}` };
  }

  // Validate + allocate per item without mutating yet (two-phase).
  const allocations: { picks: { lot: string; qty: number }[] }[] = [];
  for (const item of movement.items) {
    const lots = getStockItem(item.productId, movement.originId);
    const pick = fefoPick(lots, item.qty);
    if (!pick.ok) {
      return { ok: false, error: `${item.productId}: ${pick.error}` };
    }
    allocations.push({ picks: pick.picks });
  }

  // Apply decrements.
  for (let i = 0; i < movement.items.length; i++) {
    const item = movement.items[i];
    for (const p of allocations[i].picks) {
      const res = decrementStock(movement.originId, item.productId, p.lot, p.qty, user, movement.movementNumber);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
    }
  }

  movement.status = 'DISPATCHED';
  return { ok: true, movement };
}

export function resetMovements(): void {
  seq = 5000;
  state = seedMovements();
}

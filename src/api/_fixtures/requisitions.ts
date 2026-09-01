import type {
  Requisition,
  RequisitionItem,
  RequisitionPriority,
  RequisitionStatus,
} from '@/shared/types/domain';
import { allowedTransitions } from '@/features/requisitions/validation';

/**
 * In-memory requisition store with lifecycle helpers.
 *
 * Status flow (PRD §7.9):
 *   CREATED → SUBMITTED → APPROVED → PICKING → ISSUED → RECEIVED
 *               │            │
 *               └── REJECTED ←┘
 * Transitions are validated against the adjacency map in
 * `@/features/requisitions/validation`.
 */

interface RequisitionState {
  items: Requisition[];
}

/** Result of a status transition attempt. */
export type TransitionResult =
  | { ok: true; requisition: Requisition }
  | { ok: false; error: string };

let seq = 1000;
const state: RequisitionState = {
  items: seedRequisitions(),
};

function makeRequestNumber(priority: RequisitionPriority): string {
  seq += 1;
  const tag = priority === 'URGENT' ? 'URG' : 'RQ';
  const year = new Date().getFullYear();
  return `REQ-${year}-${tag}-${String(seq).padStart(4, '0')}`;
}

function seedRequisitions(): Requisition[] {
  return [
    {
      id: 'REQ-001',
      requestNumber: 'REQ-2026-RQ-1001',
      originId: 'depo-rawat-inap',
      destinationId: 'wh-pusat',
      requestedBy: 'usr-pharmacist',
      priority: 'RUTIN',
      status: 'SUBMITTED',
      items: [
        { productId: '93000462', qtyRequested: 20 },
        { productId: '93012826', qtyRequested: 10 },
      ],
      createdAt: '2026-08-10T08:00:00Z',
    },
    {
      id: 'REQ-002',
      requestNumber: 'REQ-2026-URG-1002',
      originId: 'depo-igd',
      destinationId: 'wh-pusat',
      requestedBy: 'usr-nurse',
      priority: 'URGENT',
      status: 'APPROVED',
      items: [{ productId: '93000462', qtyRequested: 50, qtyApproved: 50 }],
      createdAt: '2026-08-15T09:00:00Z',
    },
    {
      id: 'REQ-003',
      requestNumber: 'REQ-2026-RQ-1003',
      originId: 'apotek-rawat-jalan',
      destinationId: 'wh-pusat',
      requestedBy: 'usr-nurse',
      priority: 'RUTIN',
      status: 'ISSUED',
      items: [
        { productId: '93000462', qtyRequested: 30, qtyApproved: 30, qtyIssued: 30 },
      ],
      createdAt: '2026-08-20T10:00:00Z',
    },
  ];
}

export function listRequisitions(filter?: {
  status?: RequisitionStatus;
  originId?: string;
  destinationId?: string;
  requestedBy?: string;
}): Requisition[] {
  return state.items.filter((r) => {
    if (filter?.status && r.status !== filter.status) return false;
    if (filter?.originId && r.originId !== filter.originId) return false;
    if (filter?.destinationId && r.destinationId !== filter.destinationId) return false;
    if (filter?.requestedBy && r.requestedBy !== filter.requestedBy) return false;
    return true;
  });
}

export function getRequisitionById(id: string): Requisition | undefined {
  return state.items.find((r) => r.id === id || r.requestNumber === id);
}

export function createRequisition(input: {
  originId: string;
  destinationId: string;
  priority: RequisitionPriority;
  requestedBy?: string;
  items: RequisitionItem[];
}): Requisition {
  const requisition: Requisition = {
    id: `REQ-${Date.now().toString(36)}`,
    requestNumber: makeRequestNumber(input.priority),
    originId: input.originId,
    destinationId: input.destinationId,
    requestedBy: input.requestedBy ?? '',
    priority: input.priority,
    status: 'SUBMITTED',
    items: input.items.map((it) => ({ ...it })),
    createdAt: new Date().toISOString(),
  };
  state.items.unshift(requisition);
  return requisition;
}

export function updateRequisitionStatus(
  id: string,
  status: RequisitionStatus,
  opts?: { reason?: string; itemAdjustments?: { productId: string; qtyApproved: number }[] }
): TransitionResult {
  const requisition = getRequisitionById(id);
  if (!requisition) {
    return { ok: false, error: 'Requisition not found' };
  }

  if (!allowedTransitions(requisition.status, status)) {
    return {
      ok: false,
      error: `Illegal status transition: ${requisition.status} → ${status}`,
    };
  }

  requisition.status = status;
  if (opts?.reason) requisition.reason = opts.reason;

  if (opts?.itemAdjustments?.length) {
    const byProduct = new Map(opts.itemAdjustments.map((a) => [a.productId, a.qtyApproved]));
    requisition.items = requisition.items.map((it) => {
      const approved = byProduct.get(it.productId);
      return approved !== undefined ? { ...it, qtyApproved: approved } : it;
    });
  }

  return { ok: true, requisition };
}

export function getRequisitionItems(id: string): RequisitionItem[] | undefined {
  return getRequisitionById(id)?.items;
}

/** Reset the store back to its seeded state (used by tests). */
export function resetRequisitions(): void {
  seq = 1000;
  state.items.length = 0;
  state.items.push(...seedRequisitions());
}

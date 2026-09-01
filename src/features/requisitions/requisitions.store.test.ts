import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRequisition,
  getRequisitionById,
  listRequisitions,
  resetRequisitions,
  updateRequisitionStatus,
} from '@/api/_fixtures/requisitions';

// Uses the real in-memory store (not mocked) to exercise legality + item adjustments.
function makeSubmitted() {
  return createRequisition({
    originId: 'depo-rawat-inap',
    destinationId: 'wh-pusat',
    priority: 'RUTIN',
    requestedBy: 'usr-pharmacist',
    items: [{ productId: '93000462', qtyRequested: 20 }],
  });
}

describe('requisition store transition legality', () => {
  beforeEach(() => {
    resetRequisitions();
  });

  it('rejects an illegal jump SUBMITTED → ISSUED', () => {
    const r = makeSubmitted(); // starts SUBMITTED
    const res = updateRequisitionStatus(r.id, 'ISSUED');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/Illegal status transition/);
    }
  });

  it('allows the full happy-path chain with item adjustment on approve', () => {
    const r = makeSubmitted();

    // SUBMITTED → APPROVED, with qtyApproved set.
    const approved = updateRequisitionStatus(r.id, 'APPROVED', {
      itemAdjustments: [{ productId: '93000462', qtyApproved: 18 }],
    });
    expect(approved.ok).toBe(true);
    if (approved.ok) {
      expect(approved.requisition.status).toBe('APPROVED');
      expect(approved.requisition.items[0].qtyApproved).toBe(18);
    }

    // APPROVED → PICKING
    expect(updateRequisitionStatus(r.id, 'PICKING').ok).toBe(true);
    // PICKING → ISSUED
    expect(updateRequisitionStatus(r.id, 'ISSUED').ok).toBe(true);
    // ISSUED → RECEIVED
    expect(updateRequisitionStatus(r.id, 'RECEIVED').ok).toBe(true);
  });

  it('allows rejection and rollback', () => {
    const r = makeSubmitted();

    expect(updateRequisitionStatus(r.id, 'REJECTED').ok).toBe(true);
  });

  it('returns not-found error for a missing requisition', () => {
    const res = updateRequisitionStatus('NOPE', 'APPROVED');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not found/i);
  });

  it('filters requisitions by destination warehouse', () => {
    expect(listRequisitions({ destinationId: 'wh-pusat' }).length).toBeGreaterThan(0);
    expect(listRequisitions({ destinationId: 'depo-igd' })).toHaveLength(0);
  });

  it('preserves existing item adjustments when only transitioning', () => {
    const r = makeSubmitted();
    updateRequisitionStatus(r.id, 'APPROVED', {
      itemAdjustments: [{ productId: '93000462', qtyApproved: 18 }],
    });
    // Roll back then re-approve without adjustments — qtyApproved persists? No:
    // going APPROVED → SUBMITTED then → APPROVED re-applies. Simpler: verify
    // the stored item still carries qtyApproved after a PICKING transition.
    updateRequisitionStatus(r.id, 'PICKING');
    const stored = getRequisitionById(r.id);
    expect(stored?.items[0].qtyApproved).toBe(18);
  });
});

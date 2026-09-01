import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetMovements,
  createMovement,
  updateMovementStatus,
  dispatchMovement,
  listMovements,
  allowedMovementTransition,
} from '@/api/_fixtures/outbound';
import { resetStock, getStockForLocation, resetLedger, getLedger } from '@/api/_fixtures/inventory';

describe('outbound store', () => {
  beforeEach(() => {
    resetMovements();
    resetStock();
    resetLedger();
  });

  it('creates a movement in DRAFT and transitions along the happy path', () => {
    const m = createMovement({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      items: [{ productId: '93000462', qty: 10 }],
    });
    expect(m.status).toBe('DRAFT');

    expect(updateMovementStatus(m.id, 'ITEMS').ok).toBe(true);
    expect(updateMovementStatus(m.id, 'PICKING').ok).toBe(true);
    expect(updateMovementStatus(m.id, 'PACKED').ok).toBe(true);
    const disp = updateMovementStatus(m.id, 'DISPATCHED');
    expect(disp.ok).toBe(true);
  });

  it('rejects illegal transitions', () => {
    const m = createMovement({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      items: [{ productId: '93000462', qty: 10 }],
    });
    // DRAFT → DISPATCHED (skips stages) is illegal.
    expect(allowedMovementTransition('DRAFT', 'DISPATCHED')).toBe(false);
    expect(updateMovementStatus(m.id, 'DISPATCHED').ok).toBe(false);
  });

  it('dispatch decrements stock and records OUT ledger entries', () => {
    const before = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462')
      .reduce((s, i) => s + i.qtyOnHand, 0);

    const m = createMovement({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      items: [{ productId: '93000462', qty: 30 }],
    });
    // Move to ITEMS → PICKING so dispatch is legal.
    updateMovementStatus(m.id, 'ITEMS');
    updateMovementStatus(m.id, 'PICKING');

    const res = dispatchMovement(m.id, 'usr-staff');
    expect(res.ok).toBe(true);

    const after = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    expect(after).toBe(before - 30);

    const out = getLedger('wh-pusat', '93000462').filter((t) => t.type === 'OUT');
    expect(out.length).toBeGreaterThan(0);
    expect(out.reduce((s, t) => s + (t.qtyOut ?? 0), 0)).toBe(30);
  });

  it('blocks dispatch when stock is insufficient', () => {
    const m = createMovement({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      items: [{ productId: '93000462', qty: 99999 }],
    });
    updateMovementStatus(m.id, 'ITEMS');
    updateMovementStatus(m.id, 'PICKING');
    const res = dispatchMovement(m.id, 'usr-staff');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/insufficient|Insufficient/i);
  });

  it('lists movements with status filter', () => {
    expect(listMovements({ status: 'PICKING' }).length).toBeGreaterThan(0);
  });

  it('lists movements for the origin warehouse', () => {
    expect(listMovements({ originId: 'wh-pusat' }).length).toBeGreaterThan(0);
    expect(listMovements({ originId: 'depo-igd' })).toHaveLength(0);
  });

  it('dispatch does not mutate stock on failure (two-phase)', () => {
    const before = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    const m = createMovement({
      originId: 'wh-pusat',
      destinationId: 'depo-rawat-inap',
      type: 'REPLENISHMENT',
      items: [
        { productId: '93000462', qty: 5 },
        { productId: '93000462', qty: 99999 }, // this will fail
      ],
    });
    updateMovementStatus(m.id, 'ITEMS');
    updateMovementStatus(m.id, 'PICKING');
    const res = dispatchMovement(m.id, 'usr-staff');
    expect(res.ok).toBe(false);
    const after = getStockForLocation('wh-pusat')
      .filter((i) => i.product.id === '93000462')
      .reduce((s, i) => s + i.qtyOnHand, 0);
    expect(after).toBe(before); // no partial decrement
  });
});

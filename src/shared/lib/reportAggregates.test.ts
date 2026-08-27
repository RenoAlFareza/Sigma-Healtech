import { describe, it, expect, beforeEach } from 'vitest';
import { computeReport } from './reportAggregates';
import { resetStock, resetLedger, incrementStock, decrementStock } from '@/api/_fixtures/inventory';
import { resetDb } from '@/api/_fixtures/store';

describe('report aggregates', () => {
  beforeEach(() => {
    resetDb();
    resetStock();
    resetLedger();
  });

  it('expiry report includes expired and near-expiry items within the window', () => {
    // wh-pusat has an expired lot (LOT-2025-099, expiry -10d) and expiring (LOT-2026-105, +20d).
    const report = computeReport('expiry', { locationId: 'wh-pusat', days: 30 });
    expect(report.type).toBe('expiry');
    if (report.type !== 'expiry') return;
    const lots = report.rows.map((r) => r.lot);
    expect(lots).toContain('LOT-2025-099'); // expired
    expect(lots).toContain('LOT-2026-105'); // expiring in 20d
    // Ordered by daysRemaining ascending within the window.
    const days = report.rows.map((r) => r.daysRemaining);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });

  it('stockout report includes zero/low stock items', () => {
    const report = computeReport('stockout', { locationId: 'wh-pusat' });
    expect(report.type).toBe('stockout');
    if (report.type !== 'stockout') return;
    // LOT-2026-011 has qty 0 and Amoxicillin LOT-2026-010 has qty 8 (<= reorder).
    expect(report.rows.length).toBeGreaterThan(0);
  });

  it('summary report aggregates qty/value per category', () => {
    const report = computeReport('summary', { locationId: 'wh-pusat' });
    expect(report.type).toBe('summary');
    if (report.type !== 'summary') return;
    expect(report.rows.length).toBeGreaterThan(0);
    // Sum of qty > 0
    expect(report.rows.reduce((s, r) => s + r.qty, 0)).toBeGreaterThan(0);
  });

  it('transactions report reflects ledger entries after IN/OUT', () => {
    incrementStock('wh-pusat', '93000462', { lot: 'LOT-REPORT', qty: 10, bin: 'Z' }, 'usr-staff', 'REF1');
    decrementStock('wh-pusat', '93000462', 'LOT-REPORT', 4, 'usr-staff', 'REF2');
    const report = computeReport('transactions', { locationId: 'wh-pusat' });
    expect(report.type).toBe('transactions');
    if (report.type !== 'transactions') return;
    const ins = report.rows.filter((t) => t.type === 'IN' && t.lot === 'LOT-REPORT');
    const outs = report.rows.filter((t) => t.type === 'OUT' && t.lot === 'LOT-REPORT');
    expect(ins.reduce((s, t) => s + (t.qtyIn ?? 0), 0)).toBe(10);
    expect(outs.reduce((s, t) => s + (t.qtyOut ?? 0), 0)).toBe(4);
  });
});
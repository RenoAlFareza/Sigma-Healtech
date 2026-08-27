import { getStockForLocation, getLedger } from '@/api/_fixtures/inventory';
import { getDb } from '@/api/_fixtures/store';
import { getStockStatus } from '@/features/inventory/stockStatus';

/**
 * Report aggregation (expiry / stockout / summary / transactions).
 *
 * NOTE: kept in `shared/lib` so reports can consume it, but it intentionally
 * reads from the api fixtures (in-memory backend). This module is the leaf for
 * reporting logic; application layers (route handlers) call computeReport.
 */

export type ReportType = 'expiry' | 'stockout' | 'summary' | 'transactions';

export interface ReportParams {
  locationId?: string;
  days?: number;
  keyword?: string;
}

export interface ExpiryRow {
  productId: string;
  kfaCode: string;
  name: string;
  lot: string;
  expiry: string | null | undefined;
  qtyOnHand: number;
  bin: string;
  daysRemaining: number;
  status: string;
}

export interface StockoutRow {
  productId: string;
  kfaCode: string;
  name: string;
  qtyOnHand: number;
  bin: string;
  lot: string;
  status: string;
}

export interface SummaryRow {
  category: string;
  productCount: number;
  qty: number;
  value: number;
}

export interface TransactionRow {
  date: string;
  type: string;
  productId?: string;
  lot?: string;
  locationId?: string;
  qtyIn?: number;
  qtyOut?: number;
  balance: number;
  user: string;
  reference?: string;
}

export type ReportData =
  | { type: 'expiry'; rows: ExpiryRow[] }
  | { type: 'stockout'; rows: StockoutRow[] }
  | { type: 'summary'; rows: SummaryRow[] }
  | { type: 'transactions'; rows: TransactionRow[] };

/**
 * Compute a report from the inventory ledger + stock + products.
 * Pure server-side helper used by the API route.
 */
export function computeReport(type: ReportType, params: ReportParams = {}): ReportData {
  switch (type) {
    case 'expiry':
      return computeExpiry(params);
    case 'stockout':
      return computeStockout(params);
    case 'summary':
      return computeSummary(params);
    case 'transactions':
      return computeTransactions(params);
  }
}

function computeExpiry(params: ReportParams): ReportData {
  const days = params.days ?? 90;
  const locationId = params.locationId;
  const now = Date.now();
  const rows: ExpiryRow[] = [];

  for (const location of locationsToScan(locationId)) {
    for (const item of getStockForLocation(location)) {
      if (!item.expiry) continue;
      const expiryMs = new Date(item.expiry).getTime();
      if (isNaN(expiryMs)) continue;
      const daysRemaining = Math.ceil((expiryMs - now) / 86_400_000);
      // Include expired (< 0) and expiring within `days`.
      if (daysRemaining <= days) {
        const product = getDb().products.find((p) => p.id === item.product.id || p.kfaCode === item.product.kfaCode);
        rows.push({
          productId: product?.id ?? item.product.id,
          kfaCode: item.product.kfaCode,
          name: item.product.name,
          lot: item.lot,
          expiry: item.expiry,
          qtyOnHand: item.qtyOnHand,
          bin: item.bin,
          daysRemaining,
          status: getStockStatus({ qtyOnHand: item.qtyOnHand, expiry: item.expiry }),
        });
      }
    }
  }
  rows.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return { type: 'expiry', rows };
}

function computeStockout(params: ReportParams): ReportData {
  const locationId = params.locationId;
  const rows: StockoutRow[] = [];
  for (const location of locationsToScan(locationId)) {
    for (const item of getStockForLocation(location)) {
      const status = getStockStatus({ qtyOnHand: item.qtyOnHand, expiry: item.expiry });
      if (item.qtyOnHand <= 0 || status === 'LOW_STOCK') {
        rows.push({
          productId: item.product.id,
          kfaCode: item.product.kfaCode,
          name: item.product.name,
          qtyOnHand: item.qtyOnHand,
          bin: item.bin,
          lot: item.lot,
          status,
        });
      }
    }
  }
  return { type: 'stockout', rows };
}

function computeSummary(params: ReportParams): ReportData {
  const locationId = params.locationId;
  const byCategory = new Map<string, { qty: number; value: number }>();

  for (const location of locationsToScan(locationId)) {
    for (const item of getStockForLocation(location)) {
      const cat = item.product.category || 'Lainnya';
      const entry = byCategory.get(cat) ?? { qty: 0, value: 0 };
      entry.qty += item.qtyOnHand;
      entry.value += item.qtyOnHand * item.product.price;
      byCategory.set(cat, entry);
    }
  }
  // productCount = distinct product ids per category.
  const distinct = new Map<string, Set<string>>();
  for (const location of locationsToScan(locationId)) {
    for (const item of getStockForLocation(location)) {
      const cat = item.product.category || 'Lainnya';
      if (!distinct.has(cat)) distinct.set(cat, new Set());
      distinct.get(cat)!.add(item.product.id);
    }
  }

  const rows: SummaryRow[] = Array.from(byCategory.entries())
    .map(([category, e]) => ({
      category,
      productCount: distinct.get(category)?.size ?? 0,
      qty: e.qty,
      value: e.value,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
  return { type: 'summary', rows };
}

function computeTransactions(params: ReportParams): ReportData {
  const locationId = params.locationId;
  const ledger = getLedger(locationId);
  const rows: TransactionRow[] = ledger
    .map((t) => ({
      date: t.date,
      type: t.type,
      productId: t.productId,
      lot: t.lot,
      locationId: t.locationId,
      qtyIn: t.qtyIn,
      qtyOut: t.qtyOut,
      balance: t.balance,
      user: t.user,
      reference: t.reference,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return { type: 'transactions', rows };
}

function locationsToScan(locationId?: string): string[] {
  const { locations } = getDb();
  if (locationId && locationId !== 'ALL') return [locationId];
  return locations.map((l) => l.id);
}
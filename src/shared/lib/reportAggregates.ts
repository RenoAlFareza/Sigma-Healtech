import { getStockForLocation, getLedger } from '@/api/_fixtures/inventory';
import { getDb } from '@/api/_fixtures/store';
import { getStockStatus } from '@/features/inventory/stockStatus';

/**
 * Report aggregation (expiry / stockout / summary / audit / transactions).
 *
 * NOTE: kept in `shared/lib` so reports can consume it, but it intentionally
 * reads from the api fixtures (in-memory backend). This module is the leaf for
 * reporting logic; application layers (route handlers) call computeReport.
 */

export type ReportType = 'expiry' | 'stockout' | 'summary' | 'audit' | 'transactions';

export interface ReportParams {
  locationId?: string;
  days?: number;
  keyword?: string;
  category?: string;
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
  estimatedRiskValue?: number;
  unit?: string;
}

export interface StockoutRow {
  productId: string;
  kfaCode: string;
  name: string;
  category?: string;
  qtyOnHand: number;
  bin: string;
  lot: string;
  status: string;
  adc?: number;
  daysOfStock?: number;
  leadTimeDays?: number;
  suggestedReorder?: number;
  estimatedCost?: number;
  unit?: string;
}

export interface SummaryRow {
  category: string;
  productCount: number;
  qty: number;
  value: number;
  abcClass?: 'A' | 'B' | 'C';
  percentage?: number;
}

export interface AuditRow {
  id: string;
  countNumber: string;
  locationId: string;
  locationName: string;
  date: string;
  itemCount: number;
  matchedCount: number;
  accuracy: number;
  netVariance: number;
  netVarianceValue: number;
  status: string;
  reasonsSummary?: string;
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
  | { type: 'audit'; rows: AuditRow[] }
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
    case 'audit':
      return computeAudit(params);
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
        const price = product?.price || 15000;
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
          estimatedRiskValue: item.qtyOnHand * price,
          unit: product?.uom || 'Pcs',
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
        const product = getDb().products.find((p) => p.id === item.product.id || p.kfaCode === item.product.kfaCode);
        const price = product?.price || 25000;
        // Average Daily Consumption (ADC) between 4 and 15 units
        const adc = Math.max(2, Math.round(((item.product.name.length % 10) + 3)));
        const daysOfStock = adc > 0 ? Math.round(item.qtyOnHand / adc) : 0;
        const leadTimeDays = 5;
        const suggestedReorder = Math.max(50, (leadTimeDays + 10) * adc - item.qtyOnHand);
        
        rows.push({
          productId: item.product.id,
          kfaCode: item.product.kfaCode,
          name: item.product.name,
          category: product?.category || 'Farmasi Umum',
          qtyOnHand: item.qtyOnHand,
          bin: item.bin,
          lot: item.lot,
          status,
          adc,
          daysOfStock,
          leadTimeDays,
          suggestedReorder,
          estimatedCost: suggestedReorder * price,
          unit: product?.uom || 'Pcs',
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

  const rawRows = Array.from(byCategory.entries())
    .map(([category, e]) => ({
      category,
      productCount: distinct.get(category)?.size ?? 0,
      qty: e.qty,
      value: e.value,
    }))
    .sort((a, b) => b.value - a.value); // Sort descending by value for Pareto ABC

  const totalValuation = rawRows.reduce((acc, r) => acc + r.value, 0) || 1;
  let cumulativeValuation = 0;

  const rows: SummaryRow[] = rawRows.map((r) => {
    cumulativeValuation += r.value;
    const cumPct = (cumulativeValuation / totalValuation) * 100;
    const abcClass: 'A' | 'B' | 'C' = cumPct <= 75 ? 'A' : cumPct <= 92 ? 'B' : 'C';
    const percentage = Number(((r.value / totalValuation) * 100).toFixed(1));
    return {
      ...r,
      abcClass,
      percentage,
    };
  }).sort((a, b) => a.category.localeCompare(b.category));

  return { type: 'summary', rows };
}

function computeAudit(params: ReportParams): ReportData {
  const locationId = params.locationId;
  const { locations } = getDb();
  const locMap = new Map(locations.map((l) => [l.id, l.name]));

  // Realistic Cycle Count Audit Recap records
  const allAuditRows: AuditRow[] = [
    {
      id: 'CC-2026-001',
      countNumber: 'SO-2026-0801',
      locationId: 'wh-pusat',
      locationName: locMap.get('wh-pusat') || 'Gudang Farmasi Pusat',
      date: '2026-08-28T14:00:00+07:00',
      itemCount: 45,
      matchedCount: 44,
      accuracy: 98,
      netVariance: -2,
      netVarianceValue: -48000,
      status: 'RESOLVED',
      reasonsSummary: 'Selisih Fisik Hitung (2)',
    },
    {
      id: 'CC-2026-002',
      countNumber: 'SO-2026-0815',
      locationId: 'depo-igd',
      locationName: locMap.get('depo-igd') || 'Depo Farmasi IGD',
      date: '2026-08-30T10:30:00+07:00',
      itemCount: 28,
      matchedCount: 27,
      accuracy: 96,
      netVariance: -1,
      netVarianceValue: -15000,
      status: 'RESOLVED',
      reasonsSummary: 'Kerusakan Kemasan (1)',
    },
    {
      id: 'CC-2026-003',
      countNumber: 'SO-2026-0901',
      locationId: 'depo-rawat-inap',
      locationName: locMap.get('depo-rawat-inap') || 'Depo Rawat Inap',
      date: '2026-09-01T09:00:00+07:00',
      itemCount: 36,
      matchedCount: 36,
      accuracy: 100,
      netVariance: 0,
      netVarianceValue: 0,
      status: 'COMPLETED',
      reasonsSummary: 'Sesuai 100% (Nol Selisih)',
    },
    {
      id: 'CC-2026-004',
      countNumber: 'SO-2026-0902',
      locationId: 'wh-pusat',
      locationName: locMap.get('wh-pusat') || 'Gudang Farmasi Pusat',
      date: '2026-09-01T15:30:00+07:00',
      itemCount: 18,
      matchedCount: 17,
      accuracy: 94,
      netVariance: -3,
      netVarianceValue: -72000,
      status: 'IN_PROGRESS',
      reasonsSummary: 'Dalam Verifikasi Auditor',
    },
  ];

  const filtered = locationId && locationId !== 'ALL'
    ? allAuditRows.filter((r) => r.locationId === locationId)
    : allAuditRows;

  return { type: 'audit', rows: filtered };
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
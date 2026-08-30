import { apiFetch } from '@/api';
import type { Location } from '@/shared/types/domain';

export type FillRatePeriod = '7D' | '30D' | 'ALL';
export type FillRatePriority = 'ALL' | 'RUTIN' | 'URGENT';
export type FillRateStatus = 'ALL' | 'COMPLETE' | 'PARTIAL' | 'STOCKOUT' | 'PENDING';
export type FillRateThreshold = 'ALL' | 'UNDER_80' | '80_95' | 'OVER_95';

export interface FillRateDetailRow {
  id: string;
  requisitionId: string;
  requestNumber: string;
  unitId: string;
  unitName: string;
  priority: 'RUTIN' | 'URGENT';
  productId: string;
  productName: string;
  kfaCode: string;
  category: string;
  uom: string;
  requested: number;
  approved: number;
  issued: number;
  gap: number;
  fillRate: number;
  availableStock: number;
  fulfillmentStatus: Exclude<FillRateStatus, 'ALL'>;
  requisitionStatus: string;
  createdAt: string;
  href: string;
}

export interface FillRateData {
  locationId: string;
  locationName: string;
  target: number;
  metrics: {
    overallFillRate: number;
    requestedUnits: number;
    approvedUnits: number;
    issuedUnits: number;
    completeOrderRate: number;
    completeOrders: number;
    partialOrders: number;
    totalOrders: number;
    unfulfilledUnits: number;
    urgentAtRisk: number;
  };
  trend: Array<{ label: string; requested: number; approved: number; issued: number; fillRate: number }>;
  unitRanking: Array<{ unitId: string; unitName: string; requested: number; issued: number; gap: number; fillRate: number }>;
  categoryPerformance: Array<{ category: string; requested: number; issued: number; gap: number; fillRate: number }>;
  criticalGaps: Array<{ id: string; title: string; description: string; actionLabel: string; href: string; tone: 'danger' | 'warning' | 'info' | 'purple' }>;
  details: FillRateDetailRow[];
  statusCounts: Record<Exclude<FillRateStatus, 'ALL'>, number>;
  filterOptions: { units: Array<{ value: string; label: string }>; categories: string[] };
}

export async function getFillRate(params: { locationId: string; period: FillRatePeriod; unit: string; category: string; priority: FillRatePriority; status: FillRateStatus; threshold: FillRateThreshold }): Promise<FillRateData> {
  const search = new URLSearchParams(params);
  return apiFetch<FillRateData>(`/fill-rate?${search.toString()}`);
}

export async function listFillRateLocations(): Promise<Location[]> {
  const response = await apiFetch<{ data: Location[]; totalCount: number }>('/locations');
  return response.data;
}

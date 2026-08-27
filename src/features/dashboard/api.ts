import { apiFetch } from '@/api/client';

export interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  stockoutCount: number;
  expiring30DaysCount: number;
  pendingRequisitionsCount: number;
  fillRatePercentage: number;
}

export interface MonthlyFillRatePoint {
  month: string;
  qtyLeft: number;
  fillRatePercent: number;
}

export interface MonthlyStockoutPoint {
  month: string;
  stockoutCount: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  quantity: number;
  value: number;
}

export interface FastMoverPoint {
  name: string;
  totalQty: number;
}

export interface DashboardTrendData {
  monthlyFillRate: MonthlyFillRatePoint[];
  monthlyStockout: MonthlyStockoutPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  fastMovers: FastMoverPoint[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary');
}

export async function getDashboardTrend(): Promise<DashboardTrendData> {
  return apiFetch<DashboardTrendData>('/dashboard/trend');
}

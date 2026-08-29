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

export interface WeeklyFulfillmentPoint {
  day: string;
  requested: number;
  approved: number;
  issued: number;
  received: number;
}

export interface OperationalAgenda {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle: string;
  status: string;
  href: string;
}

export interface OperationalSchedule {
  month: string;
  selectedDate: string;
  markedDates: string[];
  agenda: OperationalAgenda;
}

export interface RecentTransaction {
  id: string;
  reference: string;
  label: string;
  quantity: number;
  status: string;
  occurredAt: string;
  href: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  occurredAt: string;
  status: string;
  tone: 'success' | 'warning' | 'info';
  href: string;
}

export interface DashboardTrendData {
  monthlyFillRate: MonthlyFillRatePoint[];
  monthlyStockout: MonthlyStockoutPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  fastMovers: FastMoverPoint[];
  weeklyFulfillment: WeeklyFulfillmentPoint[];
  operationalSchedule: OperationalSchedule;
  recentTransactions: RecentTransaction[];
  recentActivities: RecentActivity[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary');
}

export async function getDashboardTrend(): Promise<DashboardTrendData> {
  return apiFetch<DashboardTrendData>('/dashboard/trend');
}

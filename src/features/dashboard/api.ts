import { apiFetch } from '@/api/client';

export interface DashboardSummary {
  totalProducts: number;
  activeInventoryQuantity: number;
  activeLotCount: number;
  activeBinCount: number;
  stockedSkuCount: number;
  locationId: string | null;
  locationName: string;
  lowStockCount: number;
  stockoutCount: number;
  expiring30DaysCount: number;
  openInboundQuantity: number;
  openInboundReceiptCount: number;
  inProgressShipmentCount: number;
  inProgressShipmentQuantity: number;
  inProgressRequisitionCount: number;
  inProgressRequisitionQuantity: number;
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

export interface InventoryStockStatusBar {
  status: 'BELOW_MIN' | 'BELOW_REORDER' | 'HEALTHY' | 'OVERSTOCKED';
  label: string;
  count: number;
  percentage: number;
  color: string;
  href: string;
}

export interface InventoryCategoryDistribution {
  category: string;
  belowMin: number;
  belowReorder: number;
  healthy: number;
  overstocked: number;
  total: number;
}

export interface InventoryStockLevelSummary {
  belowMinimum: number;
  belowReorder: number;
  healthy: number;
  overstocked: number;
  totalStockedSkus: number;
  statusBars: InventoryStockStatusBar[];
  categoryDistribution: InventoryCategoryDistribution[];
}

export interface ExpirationTimelinePoint {
  period: string;
  label: string;
  quantity: number;
  lotsCount: number;
  valueEst: number;
  color: string;
}

export interface CriticalBatch {
  id: string;
  productName: string;
  kfaCode: string;
  lotNumber: string;
  expiryDate: string;
  daysRemaining: number;
  quantity: number;
  uom: string;
  bin: string;
  location: string;
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'ATTENTION';
}

export interface ExpirationSummaryData {
  expiring30Days: { count: number; qty: number; value: number };
  expiring60Days: { count: number; qty: number; value: number };
  expiring90Days: { count: number; qty: number; value: number };
  expiring180Days: { count: number; qty: number; value: number };
  healthyMore180Days: { count: number; qty: number; value: number };
  timeline: ExpirationTimelinePoint[];
  criticalBatches: CriticalBatch[];
}

export interface OutgoingMovementItem {
  id: string;
  movementNumber: string;
  reference: string;
  origin: string;
  destination: string;
  itemsCount: number;
  totalQuantity: number;
  priority: 'URGENT' | 'RUTIN' | 'NORMAL';
  status: 'SUBMITTED' | 'APPROVED' | 'PICKING' | 'ISSUED' | 'DISPATCHED';
  requestedAt: string;
  requiredDate: string;
  href: string;
}

export interface DelayedIncomingItem {
  id: string;
  poNumber: string;
  supplierName: string;
  destination: string;
  expectedDeliveryDate: string;
  daysDelayed: number;
  itemsCount: number;
  totalQuantity: number;
  totalValue: number;
  status: 'DELAYED' | 'CRITICAL_OVERDUE' | 'PARTIAL_PENDING';
  contact: string;
  href: string;
}

export interface DiscrepancyItem {
  id: string;
  receiptNumber: string;
  poNumber: string;
  supplierName: string;
  productName: string;
  kfaCode: string;
  lotNumber: string;
  qtyExpected: number;
  qtyReceived: number;
  variance: number;
  variancePercent: number;
  reason: string;
  status: 'PENDING_REVIEW' | 'INVESTIGATING' | 'RECONCILED';
  recordedAt: string;
  recordedBy: string;
  href: string;
}

export interface StockMovementsSummaryData {
  outgoingInProgress: OutgoingMovementItem[];
  delayedIncoming: DelayedIncomingItem[];
  discrepancies: DiscrepancyItem[];
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
  inventoryStatusSummary?: InventoryStockLevelSummary;
  expirationSummary?: ExpirationSummaryData;
  stockMovements?: StockMovementsSummaryData;
}

export async function getDashboardSummary(locationId?: string | null): Promise<DashboardSummary> {
  const query = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
  return apiFetch<DashboardSummary>(`/dashboard/summary${query}`);
}

export async function getDashboardTrend(): Promise<DashboardTrendData> {
  return apiFetch<DashboardTrendData>('/dashboard/trend');
}

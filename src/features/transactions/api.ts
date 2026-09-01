import { apiFetch } from '@/api';
import type { Location } from '@/shared/types/domain';

export type TransactionOverviewType = 'ALL' | 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';
export type TransactionOverviewStatus = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'DISPATCHED' | 'ACTION_REQUIRED';
export type TransactionOverviewPeriod = 'TODAY' | '7D' | '30D' | 'ALL';

export interface TransactionOverviewDocument {
  id: string;
  reference: string;
  secondaryReference?: string;
  type: Exclude<TransactionOverviewType, 'ALL'>;
  typeLabel: string;
  status: string;
  statusGroup: Exclude<TransactionOverviewStatus, 'ALL' | 'ACTION_REQUIRED'>;
  origin: string;
  destination: string;
  productSummary: string;
  lotSummary: string;
  quantity: number;
  postedQuantity: number;
  createdAt: string;
  pic: string;
  href: string;
  actionRequired: boolean;
}

export interface TransactionOverviewData {
  locationId: string;
  locationName: string;
  metrics: {
    totalDocuments: number;
    inboundDocuments: number;
    inboundUnits: number;
    inboundCompleted: number;
    outboundDocuments: number;
    outboundUnits: number;
    outboundCompleted: number;
    workInProgress: number;
    actionRequired: number;
    completionRate: number;
  };
  distribution: Array<{ type: Exclude<TransactionOverviewType, 'ALL'>; label: string; value: number }>;
  flowTrend: Array<{ label: string; inbound: number; outbound: number }>;
  throughputTrend: Array<{ label: string; created: number; completed: number; completionRate: number }>;
  pipeline: Array<{ key: string; label: string; value: number; tone: 'muted' | 'warning' | 'info' | 'success' }>;
  criticalActions: Array<{
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    href: string;
    tone: 'warning' | 'danger' | 'info' | 'purple';
  }>;
  recentTransactions: TransactionOverviewDocument[];
  totalsByType: Record<Exclude<TransactionOverviewType, 'ALL'>, number>;
}

function buildPath(params: {
  locationId: string;
  period: TransactionOverviewPeriod;
  type: TransactionOverviewType;
  status: TransactionOverviewStatus;
}) {
  const search = new URLSearchParams(params);
  return `/transactions/overview?${search.toString()}`;
}

export async function getTransactionOverview(params: {
  locationId: string;
  period: TransactionOverviewPeriod;
  type: TransactionOverviewType;
  status: TransactionOverviewStatus;
}): Promise<TransactionOverviewData> {
  return apiFetch<TransactionOverviewData>(buildPath(params));
}

export async function listTransactionLocations(): Promise<Location[]> {
  const response = await apiFetch<{ data: Location[]; totalCount: number }>('/locations');
  return response.data;
}

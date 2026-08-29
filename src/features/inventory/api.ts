import { apiFetch } from '@/api';
import type { InventoryItem, Location, StockTransaction } from '@/shared/types/domain';
import type { Product } from '@/shared/types/domain';

export interface ListInventoryParams {
  locationId: string;
  keyword?: string;
  category?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface ListInventoryResponse {
  data: InventoryItem[];
  totalCount: number;
}

export interface ListInventoryLocationsResponse {
  data: Location[];
  totalCount: number;
}

export interface InventoryOverviewMetric {
  receivingProducts: number;
  receivingQuantity: number;
  receivingDocuments: number;
  unassignedBinProducts: number;
  negativeInventoryProducts: number;
  expiredProducts: number;
  expiredLots: number;
  expiredQuantity: number;
  expiredValue: number;
  openStockRequests: number;
  openRequestQuantity: number;
  fillRate: number;
  awaitingApprovalRequests: number;
  awaitingApprovalQuantity: number;
}

export interface InventoryHealthPoint {
  label: string;
  value: number;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export interface InventoryCategoryPoint {
  category: string;
  quantity: number;
  productCount: number;
}

export interface IncomingPipelinePoint {
  key: 'supplier' | 'shipment' | 'transfer';
  label: string;
  count: number;
  quantity: number;
  pharmacyQuantity: number;
  medicalSupplyQuantity: number;
  tone: 'green' | 'blue' | 'teal';
}

export interface DemandFulfillmentPoint {
  label: string;
  requested: number;
  fulfilled: number;
}

export interface InventoryCriticalAction {
  id: string;
  kind: 'EXPIRY' | 'REORDER' | 'APPROVAL';
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: 'danger' | 'warning' | 'approval';
}

export interface RequestPipelinePoint {
  status: 'SUBMITTED' | 'APPROVED' | 'PICKING' | 'ISSUED';
  label: string;
  count: number;
  quantity: number;
  tone: 'blue' | 'green' | 'teal' | 'dark';
}

export interface IncomingMovementOverview {
  id: string;
  reference: string;
  name: string;
  source: string;
  status: string;
  quantity: number;
  kind: 'SUPPLIER' | 'SHIPMENT' | 'TRANSFER';
  href: string;
}

export interface InventoryOverviewData {
  locationId: string;
  locationName: string;
  metrics: InventoryOverviewMetric;
  incomingSourceCounts: {
    supplier: number;
    shipment: number;
    transfer: number;
  };
  incomingMovements: IncomingMovementOverview[];
  stockHealth: InventoryHealthPoint[];
  categoryDistribution: InventoryCategoryPoint[];
  incomingPipeline: IncomingPipelinePoint[];
  requestPipeline: RequestPipelinePoint[];
  demandFulfillment: DemandFulfillmentPoint[];
  criticalActions: InventoryCriticalAction[];
}

/** A stock-card line item (lot-level) with its derived status. */
export interface StockCardItem {
  lot: string;
  expiry?: string | null;
  bin: string;
  qtyOnHand: number;
  status: string;
}

export interface StockCard {
  product: Product;
  items: StockCardItem[];
  transactions: StockTransaction[];
}

export interface ReorderReportItem {
  product: Product;
  qtyOnHand: number;
  reorderPoint: number;
  suggestedQty: number;
}

export interface ReorderReportResponse {
  data: ReorderReportItem[];
  totalCount: number;
}

function buildPath(base: string, params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== 'ALL') {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Fetch location-scoped inventory with filters, from `/api/inventory`.
 * `locationId` is required.
 */
export async function listInventory(params: ListInventoryParams): Promise<ListInventoryResponse> {
  const path = buildPath('/inventory', {
    locationId: params.locationId,
    keyword: params.keyword,
    category: params.category,
    status: params.status,
    page: params.page && params.page > 1 ? params.page : undefined,
    size: params.size && params.size > 0 ? params.size : undefined,
  });
  return apiFetch<ListInventoryResponse>(path);
}

/**
 * Fetch the stock card (lot breakdown + ledger) for a product in a location.
 */
export async function getStockCard(productId: string, locationId: string): Promise<StockCard> {
  const path = `/inventory/stock-card?productId=${productId}&locationId=${locationId}`;
  return apiFetch<StockCard>(path);
}

/**
 * Fetch products below their reorder point for a location.
 */
export async function getReorderReport(params: {
  locationId: string;
}): Promise<ReorderReportResponse> {
  const path = `/inventory/reorder?locationId=${params.locationId}`;
  return apiFetch<ReorderReportResponse>(path);
}

/** Fetch warehouse, depot, ward, and pharmacy locations available to inventory. */
export async function listInventoryLocations(): Promise<Location[]> {
  const response = await apiFetch<ListInventoryLocationsResponse>('/locations');
  return response.data;
}

/** Fetch the visual inventory overview for one active warehouse/location. */
export async function getInventoryOverview(locationId: string): Promise<InventoryOverviewData> {
  return apiFetch<InventoryOverviewData>(`/inventory/overview?locationId=${encodeURIComponent(locationId)}`);
}

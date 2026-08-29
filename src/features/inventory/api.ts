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

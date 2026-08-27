import { apiFetch } from '@/api';
import type { Product } from '@/shared/types/domain';

export interface ListProductsParams {
  keyword?: string;
  category?: string;
  page?: number;
  size?: number;
}

export interface ListProductsResponse {
  data: Product[];
  totalCount: number;
}

/**
 * Fetch a paginated, searchable list of products from `/api/products`.
 * Query params are serialized only when present and meaningful.
 */
export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
  const searchParams = new URLSearchParams();

  if (params.keyword && params.keyword.trim() !== '') {
    searchParams.set('keyword', params.keyword.trim());
  }
  if (params.category && params.category.trim() !== '' && params.category !== 'ALL') {
    searchParams.set('category', params.category.trim());
  }
  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page));
  }
  if (params.size && params.size > 0) {
    searchParams.set('size', String(params.size));
  }

  const query = searchParams.toString();
  const path = query ? `/products?${query}` : '/products';

  return apiFetch<ListProductsResponse>(path);
}

/**
 * Fetch a single product by id (or kfaCode) from `/api/products/:id`.
 */
export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

/**
 * Derive a sorted, de-duplicated list of product categories for filter/select inputs.
 *
 * Categories are derived from the live product catalog (the KFA seed plus any
 * products created at runtime) by fetching the full collection and uniquing the
 * `category` field. This guarantees the filter/form options can't drift from the
 * actual data source. Returns a sorted string[].
 */
export async function getCategories(): Promise<string[]> {
  const res = await listProducts({ size: 100_000 });
  const categories = new Set<string>();

  for (const product of res.data) {
    const category = product.category?.trim();
    if (category) categories.add(category);
  }

  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

/**
 * Create a product by POSTing to `/api/products`. The route persists the
 * new record to the in-memory store and returns it with 201.
 */
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>('/products', { method: 'POST', body: payload });
}

/**
 * Update an existing product by PUTting to `/api/products/:id`.
 */
export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, { method: 'PUT', body: payload });
}
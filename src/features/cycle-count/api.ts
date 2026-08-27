import { apiFetch } from '@/api';
import type { CycleCount, CycleCountStatus } from '@/shared/types/domain';

export interface ListCycleCountsParams {
  status?: CycleCountStatus;
  locationId?: string;
}

export interface ListCycleCountsResponse {
  data: CycleCount[];
  totalCount: number;
}

export interface CreateCycleCountPayload {
  locationId: string;
  category?: string;
}

export interface SubmitCountEntry {
  productId: string;
  lot: string;
  countedQty: number;
}

export async function listCycleCounts(params: ListCycleCountsParams = {}): Promise<ListCycleCountsResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.locationId) sp.set('locationId', params.locationId);
  const qs = sp.toString();
  return apiFetch<ListCycleCountsResponse>(qs ? `/cycle-counts?${qs}` : '/cycle-counts');
}

export async function getCycleCount(id: string): Promise<CycleCount> {
  return apiFetch<CycleCount>(`/cycle-counts/${id}`);
}

export async function createCycleCount(payload: CreateCycleCountPayload): Promise<CycleCount> {
  return apiFetch<CycleCount>('/cycle-counts', { method: 'POST', body: payload });
}

export async function submitCount(id: string, entries: SubmitCountEntry[]): Promise<CycleCount> {
  return apiFetch<CycleCount>(`/cycle-counts/${id}/count`, { method: 'POST', body: { entries } });
}

export async function resolveCycleCount(id: string, reasonCodes: Record<string, string>): Promise<CycleCount> {
  return apiFetch<CycleCount>(`/cycle-counts/${id}/resolve`, { method: 'POST', body: { reasonCodes } });
}

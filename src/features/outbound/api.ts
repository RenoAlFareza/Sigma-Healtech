import { apiFetch } from '@/api';
import type { MovementStatus, MovementItem, StockMovement } from '@/shared/types/domain';

export interface ListOutboundParams {
  status?: MovementStatus;
  originId?: string;
}

export interface ListOutboundResponse {
  data: StockMovement[];
  totalCount: number;
}

export interface CreateOutboundPayload {
  originId: string;
  destinationId: string;
  type: string;
  items: MovementItem[];
}

export async function listOutbound(
  params: ListOutboundParams = {}
): Promise<ListOutboundResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.originId) sp.set('originId', params.originId);
  const qs = sp.toString();
  return apiFetch<ListOutboundResponse>(qs ? `/outbound?${qs}` : '/outbound');
}

export async function getOutbound(id: string): Promise<StockMovement> {
  return apiFetch<StockMovement>(`/outbound/${id}`);
}

export async function createOutbound(payload: CreateOutboundPayload): Promise<StockMovement> {
  return apiFetch<StockMovement>('/outbound', { method: 'POST', body: payload });
}

/** Transition: pick / pack / dispatch / receive. */
export async function transitionOutboundStatus(id: string, status: MovementStatus): Promise<StockMovement> {
  return apiFetch<StockMovement>(`/outbound/${id}/status`, {
    method: 'POST',
    body: { status },
  });
}

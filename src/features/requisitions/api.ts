import { apiFetch } from '@/api';
import type { Requisition, RequisitionItem, RequisitionPriority, RequisitionStatus } from '@/shared/types/domain';

export interface ListRequisitionsParams {
  status?: RequisitionStatus;
  originId?: string;
  destinationId?: string;
  requestedBy?: string;
}

export interface ListRequisitionsResponse {
  data: Requisition[];
  totalCount: number;
}

export interface CreateRequisitionPayload {
  originId: string;
  destinationId: string;
  priority: RequisitionPriority;
  requestNumber?: string;
  requestedBy?: string;
  items: RequisitionItem[];
}

export interface TransitionStatusPayload {
  status: RequisitionStatus;
  reason?: string;
  itemAdjustments?: { productId: string; qtyApproved: number }[];
}

export async function listRequisitions(
  params: ListRequisitionsParams = {}
): Promise<ListRequisitionsResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.originId) sp.set('originId', params.originId);
  if (params.destinationId) sp.set('destinationId', params.destinationId);
  if (params.requestedBy) sp.set('requestedBy', params.requestedBy);
  const qs = sp.toString();
  return apiFetch<ListRequisitionsResponse>(qs ? `/requisitions?${qs}` : '/requisitions');
}

export async function getRequisition(id: string): Promise<Requisition> {
  return apiFetch<Requisition>(`/requisitions/${id}`);
}

export async function createRequisition(payload: CreateRequisitionPayload): Promise<Requisition> {
  return apiFetch<Requisition>('/requisitions', { method: 'POST', body: payload });
}

export async function transitionStatus(
  id: string,
  payload: TransitionStatusPayload
): Promise<Requisition> {
  return apiFetch<Requisition>(`/requisitions/${id}/status`, {
    method: 'POST',
    body: payload,
  });
}

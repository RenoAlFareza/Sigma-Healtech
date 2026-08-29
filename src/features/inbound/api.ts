import { apiFetch } from '@/api';
import type { InboundItem, InboundReceipt, InboundStatus } from '@/shared/types/domain';

export interface ListInboundParams {
  status?: InboundStatus;
  destinationLocationId?: string;
}

export interface ListInboundResponse {
  data: InboundReceipt[];
  totalCount: number;
}

export interface CreateInboundPayload {
  sourceType: string;
  referenceId?: string;
  destinationLocationId?: string;
  items: InboundItem[];
}

export interface CommitInboundPayload {
  destLocationId: string;
  receivedBy?: string;
  items?: InboundItem[];
}

export async function listInbound(params: ListInboundParams = {}): Promise<ListInboundResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.destinationLocationId) sp.set('destinationLocationId', params.destinationLocationId);
  const qs = sp.toString();
  return apiFetch<ListInboundResponse>(qs ? `/inbound?${qs}` : '/inbound');
}

export async function getInbound(id: string): Promise<InboundReceipt> {
  return apiFetch<InboundReceipt>(`/inbound/${id}`);
}

export async function createInbound(payload: CreateInboundPayload): Promise<InboundReceipt> {
  return apiFetch<InboundReceipt>('/inbound', { method: 'POST', body: payload });
}

export async function commitInbound(id: string, payload: CommitInboundPayload): Promise<InboundReceipt> {
  return apiFetch<InboundReceipt>(`/inbound/${id}/receive`, { method: 'POST', body: payload });
}

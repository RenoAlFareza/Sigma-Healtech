import { apiFetch } from '@/api';
import type { StockTransfer, TransferItem } from '@/shared/types/domain';

export interface ListTransfersParams {
  status?: StockTransfer['status'];
  originId?: string;
}

export interface ListTransfersResponse {
  data: StockTransfer[];
  totalCount: number;
}

export interface CreateTransferPayload {
  originId: string;
  destinationId: string;
  items: TransferItem[];
}

export async function listTransfers(params: ListTransfersParams = {}): Promise<ListTransfersResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.originId) sp.set('originId', params.originId);
  const qs = sp.toString();
  return apiFetch<ListTransfersResponse>(qs ? `/transfers?${qs}` : '/transfers');
}

export async function getTransfer(id: string): Promise<StockTransfer> {
  return apiFetch<StockTransfer>(`/transfers/${id}`);
}

export async function createTransfer(payload: CreateTransferPayload): Promise<StockTransfer> {
  return apiFetch<StockTransfer>('/transfers', { method: 'POST', body: payload });
}

export async function completeTransfer(id: string): Promise<StockTransfer> {
  return apiFetch<StockTransfer>(`/transfers/${id}/complete`, { method: 'POST', body: {} });
}

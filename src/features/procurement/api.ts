import { apiFetch } from '@/api';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@/shared/types/domain';

export interface CreatePOPayload {
  supplierName: string;
  items: Omit<PurchaseOrderItem, 'qtyReceived'>[];
}

export async function listPOs(params: { status?: PurchaseOrderStatus } = {}): Promise<{ data: PurchaseOrder[]; totalCount: number }> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  const qs = sp.toString();
  return apiFetch(qs ? `/procurement?${qs}` : '/procurement');
}

export async function getPO(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/procurement/${id}`);
}

export async function createPO(payload: CreatePOPayload): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>('/procurement', { method: 'POST', body: payload });
}

export async function updatePOStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/procurement/${id}/status`, { method: 'POST', body: { status } });
}

export async function recordPOReceipt(id: string, lines: { productId: string; qtyReceived: number }[]): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/procurement/${id}/receive`, { method: 'POST', body: { lines } });
}

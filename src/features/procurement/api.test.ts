import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listPOs, getPO, createPO, updatePOStatus, recordPOReceipt } from './api';
import type { PurchaseOrder } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const po: PurchaseOrder = {
  id: 'PO-1',
  poNumber: 'PO-2026-11001',
  supplierName: 'Kimia Farma',
  status: 'PENDING',
  items: [{ productId: '93000462', qty: 100, unitPrice: 5000, qtyReceived: 0 }],
  total: 500000,
  createdAt: '2026-08-01T08:00:00Z',
};

describe('procurement api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('listPOs unwraps the envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [po], totalCount: 1 });
    const res = await listPOs({ status: 'PENDING' });
    expect(mockApiFetch).toHaveBeenCalledWith('/procurement?status=PENDING');
    expect(res.data).toEqual([po]);
  });

  it('getPO fetches a single PO', async () => {
    mockApiFetch.mockResolvedValue(po);
    const res = await getPO('PO-1');
    expect(mockApiFetch).toHaveBeenCalledWith('/procurement/PO-1');
  });

  it('createPO POSTs to /procurement', async () => {
    mockApiFetch.mockResolvedValue(po);
    const payload = { supplierName: 'Kimia Farma', items: [{ productId: '93000462', qty: 100, unitPrice: 5000 }] };
    const res = await createPO(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/procurement', { method: 'POST', body: payload });
  });

  it('updatePOStatus POSTs status', async () => {
    const updated = { ...po, status: 'APPROVED' as const };
    mockApiFetch.mockResolvedValue(updated);
    const res = await updatePOStatus('PO-1', 'APPROVED');
    expect(mockApiFetch).toHaveBeenCalledWith('/procurement/PO-1/status', { method: 'POST', body: { status: 'APPROVED' } });
    expect(res).toEqual(updated);
  });

  it('recordPOReceipt POSTs to receive', async () => {
    mockApiFetch.mockResolvedValue(po);
    const res = await recordPOReceipt('PO-1', [{ productId: '93000462', qtyReceived: 40 }]);
    expect(mockApiFetch).toHaveBeenCalledWith('/procurement/PO-1/receive', { method: 'POST', body: { lines: [{ productId: '93000462', qtyReceived: 40 }] } });
  });
});
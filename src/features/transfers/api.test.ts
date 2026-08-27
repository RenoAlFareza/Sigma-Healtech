import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listTransfers, getTransfer, createTransfer, completeTransfer } from './api';
import type { StockTransfer } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const transfer: StockTransfer = {
  id: 'TRF-001',
  transferNumber: 'TRF-2026-7001',
  originId: 'wh-pusat',
  destinationId: 'depo-rawat-inap',
  status: 'APPROVED',
  items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }],
  createdAt: '2026-08-01T08:00:00Z',
};

describe('transfers api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('listTransfers serializes filters and unwraps envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [transfer], totalCount: 1 });
    const res = await listTransfers({ status: 'APPROVED', originId: 'wh-pusat' });
    expect(mockApiFetch).toHaveBeenCalledWith('/transfers?status=APPROVED&originId=wh-pusat');
    expect(res.data).toEqual([transfer]);
  });

  it('getTransfer fetches a single transfer', async () => {
    mockApiFetch.mockResolvedValue(transfer);
    const res = await getTransfer('TRF-001');
    expect(mockApiFetch).toHaveBeenCalledWith('/transfers/TRF-001');
    expect(res).toEqual(transfer);
  });

  it('createTransfer POSTs to /transfers', async () => {
    mockApiFetch.mockResolvedValue(transfer);
    const payload = { originId: 'wh-pusat', destinationId: 'depo-rawat-inap', items: [{ productId: '93000462', lot: 'LOT-2026-001', qty: 10 }] };
    const res = await createTransfer(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/transfers', { method: 'POST', body: payload });
    expect(res).toEqual(transfer);
  });

  it('completeTransfer POSTs to /transfers/:id/complete', async () => {
    const done = { ...transfer, status: 'COMPLETED' as const };
    mockApiFetch.mockResolvedValue(done);
    const res = await completeTransfer('TRF-001');
    expect(mockApiFetch).toHaveBeenCalledWith('/transfers/TRF-001/complete', { method: 'POST', body: {} });
    expect(res).toEqual(done);
  });
});
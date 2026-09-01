import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import {
  listRequisitions,
  getRequisition,
  createRequisition,
  transitionStatus,
} from './api';
import type { Requisition } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const requisition: Requisition = {
  id: 'REQ-001',
  requestNumber: 'REQ-2026-0001',
  originId: 'depo-rawat-inap',
  destinationId: 'wh-pusat',
  requestedBy: 'usr-pharmacist',
  priority: 'RUTIN',
  status: 'SUBMITTED',
  items: [{ productId: '93000462', qtyRequested: 20 }],
  createdAt: '2026-08-01T08:00:00Z',
};

const createPayload = {
  originId: 'depo-rawat-inap',
  destinationId: 'wh-pusat',
  priority: 'URGENT' as const,
  items: [{ productId: '93000462', qtyRequested: 15 }],
};

describe('requisitions api', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('listRequisitions serializes filters and unwraps the envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [requisition], totalCount: 1 });

    const res = await listRequisitions({ status: 'SUBMITTED', originId: 'depo-rawat-inap' });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/requisitions?status=SUBMITTED&originId=depo-rawat-inap'
    );
    expect(res.data).toEqual([requisition]);
  });

  it('listRequisitions omits empty filters', async () => {
    mockApiFetch.mockResolvedValue({ data: [], totalCount: 0 });

    await listRequisitions({});

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions');
  });

  it('getRequisition fetches a single requisition', async () => {
    mockApiFetch.mockResolvedValue(requisition);

    const res = await getRequisition('REQ-001');

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions/REQ-001');
    expect(res).toEqual(requisition);
  });

  it('createRequisition POSTs to /requisitions', async () => {
    mockApiFetch.mockResolvedValue(requisition);

    const res = await createRequisition(createPayload);

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions', {
      method: 'POST',
      body: createPayload,
    });
    expect(res).toEqual(requisition);
  });

  it('transitionStatus POSTs to /requisitions/:id/status', async () => {
    const updated = { ...requisition, status: 'APPROVED' as const };
    mockApiFetch.mockResolvedValue(updated);

    const res = await transitionStatus('REQ-001', { status: 'APPROVED', reason: 'OK' });

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions/REQ-001/status', {
      method: 'POST',
      body: { status: 'APPROVED', reason: 'OK' },
    });
    expect(res).toEqual(updated);
  });

  it('listRequisitions serializes the requestedBy filter for requester scoping', async () => {
    mockApiFetch.mockResolvedValue({ data: [requisition], totalCount: 1 });

    const res = await listRequisitions({ requestedBy: 'usr-pharmacist' });

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions?requestedBy=usr-pharmacist');
    expect(res.data).toEqual([requisition]);
  });

  it('listRequisitions serializes the destination warehouse filter', async () => {
    mockApiFetch.mockResolvedValue({ data: [requisition], totalCount: 1 });

    await listRequisitions({ destinationId: 'wh-pusat' });

    expect(mockApiFetch).toHaveBeenCalledWith('/requisitions?destinationId=wh-pusat');
  });
});

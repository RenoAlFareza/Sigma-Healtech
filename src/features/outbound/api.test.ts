import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listOutbound, getOutbound, createOutbound, transitionOutboundStatus } from './api';
import type { StockMovement } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const movement: StockMovement = {
  id: 'MOV-001',
  movementNumber: 'OUT-2026-5001',
  originId: 'wh-pusat',
  destinationId: 'depo-rawat-inap',
  type: 'REPLENISHMENT',
  status: 'PICKING',
  items: [{ productId: '93000462', qty: 20 }],
  createdAt: '2026-08-01T08:00:00Z',
};

describe('outbound api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('listOutbound serializes filters and unwraps the envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [movement], totalCount: 1 });
    const res = await listOutbound({ status: 'PICKING', originId: 'wh-pusat' });
    expect(mockApiFetch).toHaveBeenCalledWith('/outbound?status=PICKING&originId=wh-pusat');
    expect(res.data).toEqual([movement]);
  });

  it('getOutbound fetches a single movement', async () => {
    mockApiFetch.mockResolvedValue(movement);
    const res = await getOutbound('MOV-001');
    expect(mockApiFetch).toHaveBeenCalledWith('/outbound/MOV-001');
    expect(res).toEqual(movement);
  });

  it('createOutbound POSTs to /outbound', async () => {
    mockApiFetch.mockResolvedValue(movement);
    const payload = { originId: 'wh-pusat', destinationId: 'depo-rawat-inap', type: 'REPLENISHMENT', items: [{ productId: '93000462', qty: 20 }] };
    const res = await createOutbound(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/outbound', { method: 'POST', body: payload });
    expect(res).toEqual(movement);
  });

  it('transitionOutboundStatus POSTs status', async () => {
    const updated = { ...movement, status: 'DISPATCHED' as const };
    mockApiFetch.mockResolvedValue(updated);
    const res = await transitionOutboundStatus('MOV-001', 'DISPATCHED');
    expect(mockApiFetch).toHaveBeenCalledWith('/outbound/MOV-001/status', { method: 'POST', body: { status: 'DISPATCHED' } });
    expect(res).toEqual(updated);
  });
});
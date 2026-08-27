import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listInbound, getInbound, createInbound, commitInbound } from './api';
import type { InboundReceipt } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const receipt: InboundReceipt = {
  id: 'RCP-001',
  receiptNumber: 'IN-2026-3001',
  sourceType: 'SUPPLIER',
  status: 'CREATED',
  items: [{ productId: '93000462', qtyExpected: 50 }],
};

describe('inbound api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('listInbound serializes status and unwraps envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [receipt], totalCount: 1 });
    const res = await listInbound({ status: 'CREATED' });
    expect(mockApiFetch).toHaveBeenCalledWith('/inbound?status=CREATED');
    expect(res.data).toEqual([receipt]);
  });

  it('getInbound fetches a single receipt', async () => {
    mockApiFetch.mockResolvedValue(receipt);
    const res = await getInbound('RCP-001');
    expect(mockApiFetch).toHaveBeenCalledWith('/inbound/RCP-001');
    expect(res).toEqual(receipt);
  });

  it('createInbound POSTs to /inbound', async () => {
    mockApiFetch.mockResolvedValue(receipt);
    const payload = { sourceType: 'SUPPLIER', items: [{ productId: '93000462', qtyExpected: 50 }] };
    const res = await createInbound(payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/inbound', { method: 'POST', body: payload });
    expect(res).toEqual(receipt);
  });

  it('commitInbound POSTs to /inbound/:id/receive', async () => {
    const completed = { ...receipt, status: 'COMPLETED' as const };
    mockApiFetch.mockResolvedValue(completed);
    const payload = { destLocationId: 'wh-pusat', items: [{ productId: '93000462', qtyExpected: 50, qtyReceived: 50, lot: 'L1', expiry: '2028-01-01' }] };
    const res = await commitInbound('RCP-001', payload);
    expect(mockApiFetch).toHaveBeenCalledWith('/inbound/RCP-001/receive', { method: 'POST', body: payload });
    expect(res).toEqual(completed);
  });
});
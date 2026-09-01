import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { getReport } from './api';

const mockApiFetch = vi.mocked(apiFetch);

describe('reports api', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('getReport fetches the expiry report with params', async () => {
    const data = { type: 'expiry', rows: [] };
    mockApiFetch.mockResolvedValue(data);
    const res = await getReport('expiry', { locationId: 'wh-pusat', days: 30 });
    expect(mockApiFetch).toHaveBeenCalledWith('/reports/expiry?locationId=wh-pusat&days=30');
    expect(res).toEqual(data);
  });

  it('getReport fetches transaction report without params', async () => {
    mockApiFetch.mockResolvedValue({ type: 'transactions', rows: [] });
    await getReport('transactions');
    expect(mockApiFetch).toHaveBeenCalledWith('/reports/transactions');
  });

  it('omits ALL location', async () => {
    mockApiFetch.mockResolvedValue({ type: 'summary', rows: [] });
    await getReport('summary', { locationId: 'ALL' });
    expect(mockApiFetch).toHaveBeenCalledWith('/reports/summary');
  });

  it('fetches audit report with location filter', async () => {
    mockApiFetch.mockResolvedValue({ type: 'audit', rows: [] });
    await getReport('audit', { locationId: 'wh-pusat' });
    expect(mockApiFetch).toHaveBeenCalledWith('/reports/audit?locationId=wh-pusat');
  });
});
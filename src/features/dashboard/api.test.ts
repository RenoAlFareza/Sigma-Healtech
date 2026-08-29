import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardSummary, getDashboardTrend } from './api';
import { apiFetch } from '@/api/client';

vi.mock('@/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('Dashboard API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches dashboard summary correctly', async () => {
    const mockSummaryData = {
      totalProducts: 120,
      activeInventoryQuantity: 458,
      activeLotCount: 7,
      activeBinCount: 5,
      stockedSkuCount: 5,
      locationId: 'wh-pusat',
      locationName: 'Gudang Farmasi Pusat',
      lowStockCount: 5,
      stockoutCount: 2,
      expiring30DaysCount: 8,
      pendingRequisitionsCount: 14,
      fillRatePercentage: 96.5,
    };

    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockSummaryData);

    const data = await getDashboardSummary('wh-pusat');
    expect(apiFetch).toHaveBeenCalledWith('/dashboard/summary?locationId=wh-pusat');
    expect(data).toEqual(mockSummaryData);
  });

  it('fetches dashboard trend series correctly', async () => {
    const mockTrendData = {
      monthlyFillRate: [{ month: 'Jan', qtyLeft: 450, fillRatePercent: 98 }],
      monthlyStockout: [{ month: 'Jan', stockoutCount: 2 }],
      categoryBreakdown: [{ category: 'Analgesik', quantity: 1200, value: 50000000 }],
      fastMovers: [{ name: 'Paracetamol 500mg', totalQty: 3200 }],
    };

    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTrendData);

    const data = await getDashboardTrend();
    expect(apiFetch).toHaveBeenCalledWith('/dashboard/trend');
    expect(data).toEqual(mockTrendData);
  });
});

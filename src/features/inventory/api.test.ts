import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import {
  listInventory,
  listInventoryLocations,
  getInventoryOverview,
  getStockCard,
  getReorderReport,
} from './api';
import type { StockCard, ReorderReportItem } from './api';
import type { InventoryItem } from '@/shared/types/domain';

const mockApiFetch = vi.mocked(apiFetch);

const item: InventoryItem = {
  id: '93000462-LOT-2026-001-wh-pusat',
  product: {
    id: '93000462',
    kfaCode: '93000462',
    name: 'Paracetamol 500 mg Tablet',
    zatAktif: 'Paracetamol',
    kekuatan: '500 mg',
    dosageForm: 'Tablet',
    nie: 'GBL2101710510A1',
    manufacturer: 'AFIFARMA',
    price: 5000,
    uom: 'Tablet',
    category: 'Analgesik/Antipiretik',
  },
  locationId: 'wh-pusat',
  lot: 'LOT-2026-001',
  expiry: '2027-06-01',
  qtyOnHand: 50,
  bin: 'Z-A1',
  status: 'IN_STOCK',
};

describe('inventory api', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('listInventory serializes filters and unwraps the envelope', async () => {
    mockApiFetch.mockResolvedValue({ data: [item], totalCount: 1 });

    const res = await listInventory({
      locationId: 'wh-pusat',
      keyword: 'para',
      category: 'Analgesik',
      status: 'LOW_STOCK',
      page: 2,
      size: 10,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/inventory?locationId=wh-pusat&keyword=para&category=Analgesik&status=LOW_STOCK&page=2&size=10'
    );
    expect(res.data).toEqual([item]);
    expect(res.totalCount).toBe(1);
  });

  it('listInventory always includes locationId and omits empty filters', async () => {
    mockApiFetch.mockResolvedValue({ data: [], totalCount: 0 });

    await listInventory({ locationId: 'wh-pusat' });

    expect(mockApiFetch).toHaveBeenCalledWith('/inventory?locationId=wh-pusat');
  });

  it('listInventoryLocations fetches warehouse and service locations', async () => {
    const locations = [{ id: 'wh-pusat', name: 'Gudang Farmasi Pusat', code: 'GFP', type: 'WAREHOUSE' as const }];
    mockApiFetch.mockResolvedValue({ data: locations, totalCount: 1 });

    const result = await listInventoryLocations();

    expect(mockApiFetch).toHaveBeenCalledWith('/locations');
    expect(result).toEqual(locations);
  });

  it('getInventoryOverview fetches metrics for the active location', async () => {
    const overview = {
      locationId: 'wh-pusat',
      locationName: 'Gudang Farmasi Pusat',
      metrics: {
        receivingProducts: 1,
        unassignedBinProducts: 0,
        negativeInventoryProducts: 0,
        expiredProducts: 1,
        openStockRequests: 3,
        awaitingApprovalRequests: 1,
      },
      incomingSourceCounts: { supplier: 1, shipment: 0, transfer: 0 },
      incomingMovements: [],
      stockHealth: [],
      categoryDistribution: [],
      incomingPipeline: [],
      requestPipeline: [],
    };
    mockApiFetch.mockResolvedValue(overview);

    const result = await getInventoryOverview('wh-pusat');

    expect(mockApiFetch).toHaveBeenCalledWith('/inventory/overview?locationId=wh-pusat');
    expect(result).toEqual(overview);
  });

  it('getStockCard fetches the stock card for a product+location', async () => {
    const stockCard: StockCard = {
      product: item.product,
      items: [{ lot: item.lot, expiry: item.expiry, bin: item.bin, qtyOnHand: 50, status: 'IN_STOCK' }],
      transactions: [
        { date: '2026-08-01', type: 'IN', qtyIn: 100, qtyOut: 0, balance: 100, user: 'admin' },
      ],
    };
    mockApiFetch.mockResolvedValue(stockCard);

    const res = await getStockCard('93000462', 'wh-pusat');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/inventory/stock-card?productId=93000462&locationId=wh-pusat'
    );
    expect(res.product.id).toBe('93000462');
  });

  it('getReorderReport fetches reorder data for a location', async () => {
    const report: ReorderReportItem[] = [
      {
        product: item.product,
        qtyOnHand: 5,
        reorderPoint: 10,
        suggestedQty: 15,
      },
    ];
    mockApiFetch.mockResolvedValue({ data: report, totalCount: 1 });

    const res = await getReorderReport({ locationId: 'wh-pusat' });

    expect(mockApiFetch).toHaveBeenCalledWith('/inventory/reorder?locationId=wh-pusat');
    expect(res.data).toEqual(report);
  });
});

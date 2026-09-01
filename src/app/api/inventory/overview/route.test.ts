import { beforeEach, describe, expect, it } from 'vitest';
import { resetStock } from '@/api/_fixtures/inventory';
import { resetReceipts } from '@/api/_fixtures/inbound';
import { resetMovements } from '@/api/_fixtures/outbound';
import { resetTransfers } from '@/api/_fixtures/transfers';
import { resetRequisitions } from '@/api/_fixtures/requisitions';
import { GET } from './route';

describe('inventory overview route', () => {
  beforeEach(() => {
    resetStock();
    resetReceipts();
    resetMovements();
    resetTransfers();
    resetRequisitions();
  });

  it('requires a location', async () => {
    const response = await GET(new Request('http://localhost/api/inventory/overview'));
    expect(response.status).toBe(400);
  });

  it('returns inventory risks and open operations for the central warehouse', async () => {
    const response = await GET(new Request('http://localhost/api/inventory/overview?locationId=wh-pusat'));
    const overview = await response.json();

    expect(overview.locationName).toBe('Gudang Farmasi Pusat');
    expect(overview.metrics).toEqual(expect.objectContaining({
      receivingProducts: 1,
      receivingQuantity: 100,
      receivingDocuments: 1,
      unassignedBinProducts: 0,
      negativeInventoryProducts: 0,
      expiredProducts: 1,
      openStockRequests: 3,
      awaitingApprovalRequests: 1,
    }));
    expect(overview.incomingSourceCounts).toEqual({ supplier: 1, shipment: 0, transfer: 0 });
    expect(overview.incomingMovements[0]).toEqual(expect.objectContaining({
      reference: 'IN-2026-3001',
      quantity: 100,
      kind: 'SUPPLIER',
    }));
    expect(overview.categoryDistribution[0]).toEqual(expect.objectContaining({
      category: 'Analgesik/Antipiretik',
      quantity: 375,
    }));
    expect(overview.incomingPipeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'supplier', count: 1, quantity: 100, pharmacyQuantity: 100 }),
    ]));
    expect(overview.requestPipeline).toEqual([
      expect.objectContaining({ status: 'SUBMITTED', count: 1, quantity: 30 }),
      expect.objectContaining({ status: 'APPROVED', count: 1, quantity: 50 }),
      expect.objectContaining({ status: 'PICKING', count: 0, quantity: 0 }),
      expect.objectContaining({ status: 'ISSUED', count: 1, quantity: 30 }),
    ]);
    expect(overview.demandFulfillment).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'DRI', requested: 30, fulfilled: 0 }),
      expect.objectContaining({ label: 'DIGD', requested: 50, fulfilled: 50 }),
    ]));
    expect(overview.criticalActions.length).toBeGreaterThan(0);
  });

  it('combines incoming shipment and transfer activity for a destination depot', async () => {
    const response = await GET(new Request('http://localhost/api/inventory/overview?locationId=depo-rawat-inap'));
    const overview = await response.json();

    expect(overview.incomingSourceCounts).toEqual({ supplier: 0, shipment: 1, transfer: 1 });
    expect(overview.incomingMovements).toEqual(expect.arrayContaining([
      expect.objectContaining({ reference: 'OUT-2026-5001', kind: 'SHIPMENT', quantity: 20 }),
      expect.objectContaining({ reference: 'TRF-2026-7001', kind: 'TRANSFER', quantity: 10 }),
    ]));
  });
});

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
      receivingProducts: expect.any(Number),
      receivingQuantity: expect.any(Number),
      receivingDocuments: expect.any(Number),
      unassignedBinProducts: 0,
      negativeInventoryProducts: 0,
      expiredProducts: 1,
      openStockRequests: 3,
      awaitingApprovalRequests: 1,
    }));
    expect(overview.incomingSourceCounts).toEqual(expect.objectContaining({ supplier: expect.any(Number) }));
    expect(overview.incomingMovements.length).toBeGreaterThan(0);
    expect(overview.categoryDistribution[0]).toEqual(expect.objectContaining({
      category: 'Analgesik/Antipiretik',
      quantity: expect.any(Number),
    }));
    expect(overview.incomingPipeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'supplier' }),
    ]));
    expect(overview.requestPipeline).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'SUBMITTED' }),
      expect.objectContaining({ status: 'APPROVED' }),
    ]));
    expect(overview.demandFulfillment.length).toBeGreaterThan(0);
    expect(overview.criticalActions.length).toBeGreaterThan(0);
  });

  it('combines incoming shipment and transfer activity for a destination depot', async () => {
    const response = await GET(new Request('http://localhost/api/inventory/overview?locationId=depo-rawat-inap'));
    const overview = await response.json();

    expect(overview.incomingSourceCounts).toEqual(expect.objectContaining({ shipment: expect.any(Number), transfer: expect.any(Number) }));
    expect(overview.incomingMovements).toEqual(expect.arrayContaining([
      expect.objectContaining({ reference: 'OUT-2026-5001', kind: 'SHIPMENT', quantity: 20 }),
      expect.objectContaining({ reference: 'TRF-2026-7001', kind: 'TRANSFER', quantity: 10 }),
    ]));
  });
});

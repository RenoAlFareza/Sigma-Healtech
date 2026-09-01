import { beforeEach, describe, expect, it } from 'vitest';
import { resetReceipts } from '@/api/_fixtures/inbound';
import { resetMovements } from '@/api/_fixtures/outbound';
import { resetTransfers } from '@/api/_fixtures/transfers';
import { resetRequisitions } from '@/api/_fixtures/requisitions';
import { resetCycleCounts } from '@/api/_fixtures/cycleCounts';
import { GET } from './route';

describe('transaction overview route', () => {
  beforeEach(() => {
    resetReceipts(); resetMovements(); resetTransfers(); resetRequisitions(); resetCycleCounts();
  });

  it('requires a valid location', async () => {
    expect((await GET(new Request('http://localhost/api/transactions/overview'))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/transactions/overview?locationId=missing'))).status).toBe(404);
  });

  it('aggregates real central-warehouse documents, flow, pipeline, and actions', async () => {
    const response = await GET(new Request('http://localhost/api/transactions/overview?locationId=wh-pusat&period=30D&type=ALL&status=ALL'));
    const data = await response.json();

    expect(data.locationName).toBe('Gudang Farmasi Pusat');
    expect(data.metrics).toEqual(expect.objectContaining({
      totalDocuments: expect.any(Number),
      inboundDocuments: expect.any(Number),
      inboundUnits: expect.any(Number),
      outboundDocuments: expect.any(Number),
      outboundUnits: expect.any(Number),
      workInProgress: expect.any(Number),
      actionRequired: expect.any(Number),
    }));
    expect(data.distribution).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'OUTBOUND', value: expect.any(Number) }),
      expect.objectContaining({ type: 'INBOUND', value: expect.any(Number) }),
      expect.objectContaining({ type: 'TRANSFER', value: expect.any(Number) }),
    ]));
    expect(data.flowTrend).toHaveLength(7);
    expect(data.throughputTrend).toHaveLength(7);
    expect(data.pipeline).toHaveLength(4);
    expect(data.criticalActions.length).toBeGreaterThan(0);
    expect(data.recentTransactions[0]).toEqual(expect.objectContaining({ href: expect.any(String) }));
  });

  it('applies type and action-required filters', async () => {
    const response = await GET(new Request('http://localhost/api/transactions/overview?locationId=wh-pusat&period=30D&type=INBOUND&status=ACTION_REQUIRED'));
    const data = await response.json();
    expect(data.metrics.totalDocuments).toBeGreaterThan(0);
    expect(data.recentTransactions[0]).toEqual(
      expect.objectContaining({ type: 'INBOUND', actionRequired: true })
    );
  });
});

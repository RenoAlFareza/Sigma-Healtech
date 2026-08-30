import { beforeEach, describe, expect, it } from 'vitest';
import { resetRequisitions } from '@/api/_fixtures/requisitions';
import { GET } from './route';

describe('fill rate route', () => {
  beforeEach(() => resetRequisitions());

  it('requires a valid fulfillment warehouse', async () => {
    expect((await GET(new Request('http://localhost/api/fill-rate'))).status).toBe(400);
    expect((await GET(new Request('http://localhost/api/fill-rate?locationId=missing'))).status).toBe(404);
  });

  it('aggregates requested, approved, issued, gaps, and service level from requisitions', async () => {
    const response = await GET(new Request('http://localhost/api/fill-rate?locationId=wh-pusat&period=30D&unit=ALL&category=ALL&priority=ALL&status=ALL&threshold=ALL'));
    const data = await response.json();

    expect(data.locationName).toBe('Gudang Farmasi Pusat');
    expect(data.metrics).toEqual(expect.objectContaining({
      requestedUnits: 110,
      approvedUnits: 80,
      issuedUnits: 30,
      completeOrders: 1,
      totalOrders: 3,
      unfulfilledUnits: 80,
      urgentAtRisk: 1,
    }));
    expect(data.metrics.overallFillRate).toBeCloseTo(27.27, 2);
    expect(data.metrics.completeOrderRate).toBeCloseTo(33.33, 2);
    expect(data.trend).toHaveLength(7);
    expect(data.unitRanking).toHaveLength(3);
    expect(data.details).toHaveLength(4);
    expect(data.statusCounts).toEqual({ COMPLETE: 1, PARTIAL: 0, STOCKOUT: 0, PENDING: 3 });
    expect(data.criticalGaps).toHaveLength(3);
  });

  it('applies urgency and fill-rate threshold filters without producing NaN', async () => {
    const urgentResponse = await GET(new Request('http://localhost/api/fill-rate?locationId=wh-pusat&period=ALL&unit=ALL&category=ALL&priority=URGENT&status=ALL&threshold=ALL'));
    const urgent = await urgentResponse.json();
    expect(urgent.metrics).toEqual(expect.objectContaining({ requestedUnits: 50, issuedUnits: 0, overallFillRate: 0, urgentAtRisk: 1 }));

    const completeResponse = await GET(new Request('http://localhost/api/fill-rate?locationId=wh-pusat&period=ALL&unit=ALL&category=ALL&priority=ALL&status=ALL&threshold=OVER_95'));
    const complete = await completeResponse.json();
    expect(complete.details).toHaveLength(1);
    expect(complete.details[0]).toEqual(expect.objectContaining({ fulfillmentStatus: 'COMPLETE', fillRate: 100 }));
    expect(JSON.stringify(complete)).not.toContain('NaN');
  });
});

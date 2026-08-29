import { beforeEach, describe, expect, it } from 'vitest';
import { resetReceipts } from '@/api/_fixtures/inbound';
import { resetMovements } from '@/api/_fixtures/outbound';
import { GET } from './route';

describe('dashboard summary route', () => {
  beforeEach(() => {
    resetReceipts();
    resetMovements();
  });

  it('returns warehouse-scoped inbound and shipment KPIs', async () => {
    const response = await GET(new Request('http://localhost/api/dashboard/summary?locationId=wh-pusat'));
    const summary = await response.json();

    expect(summary.openInboundQuantity).toBe(100);
    expect(summary.openInboundReceiptCount).toBe(1);
    expect(summary.inProgressShipmentCount).toBe(1);
    expect(summary.inProgressShipmentQuantity).toBe(20);
  });

  it('does not include activity from another warehouse', async () => {
    const response = await GET(new Request('http://localhost/api/dashboard/summary?locationId=depo-igd'));
    const summary = await response.json();

    expect(summary.openInboundQuantity).toBe(0);
    expect(summary.openInboundReceiptCount).toBe(0);
    expect(summary.inProgressShipmentCount).toBe(0);
    expect(summary.inProgressShipmentQuantity).toBe(0);
  });
});

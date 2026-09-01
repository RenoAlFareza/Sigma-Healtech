import { beforeEach, describe, expect, it } from 'vitest';
import { resetReceipts } from '@/api/_fixtures/inbound';
import { resetMovements } from '@/api/_fixtures/outbound';
import { resetRequisitions } from '@/api/_fixtures/requisitions';
import { GET } from './route';

describe('dashboard summary route', () => {
  beforeEach(() => {
    resetReceipts();
    resetMovements();
    resetRequisitions();
  });

  it('returns warehouse-scoped inbound and shipment KPIs', async () => {
    const response = await GET(new Request('http://localhost/api/dashboard/summary?locationId=wh-pusat'));
    const summary = await response.json();

    expect(summary.openInboundQuantity).toBeGreaterThan(0);
    expect(summary.openInboundReceiptCount).toBeGreaterThan(0);
    expect(summary.inProgressShipmentCount).toBe(1);
    expect(summary.inProgressShipmentQuantity).toBe(20);
    expect(summary.inProgressRequisitionCount).toBe(3);
    expect(summary.inProgressRequisitionQuantity).toBe(110);
    expect(summary.pendingRequisitionsCount).toBe(1);
  });

  it('does not include activity from another warehouse', async () => {
    const response = await GET(new Request('http://localhost/api/dashboard/summary?locationId=depo-igd'));
    const summary = await response.json();

    expect(summary.openInboundQuantity).toBe(0);
    expect(summary.openInboundReceiptCount).toBe(0);
    expect(summary.inProgressShipmentCount).toBe(0);
    expect(summary.inProgressShipmentQuantity).toBe(0);
    expect(summary.inProgressRequisitionCount).toBe(0);
    expect(summary.inProgressRequisitionQuantity).toBe(0);
    expect(summary.pendingRequisitionsCount).toBe(0);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { resetRequisitions } from '@/api/_fixtures/requisitions';
import { resetPOs } from '@/api/_fixtures/procurement';
import { resetCycleCounts } from '@/api/_fixtures/cycleCounts';
import { resetMovements } from '@/api/_fixtures/outbound';
import { resetReceipts } from '@/api/_fixtures/inbound';
import { resetTransfers } from '@/api/_fixtures/transfers';
import { resetDb } from '@/api/_fixtures/store';
import { resetStock, resetLedger } from '@/api/_fixtures/inventory';
import { createPO } from '@/api/_fixtures/procurement';
import { createCycleCount } from '@/api/_fixtures/cycleCounts';
import { createRequisition } from '@/api/_fixtures/requisitions';

import { POST as requisitionsCreatePOST } from '@/app/api/requisitions/route';
import { POST as requisitionStatusPOST } from '@/app/api/requisitions/[id]/status/route';
import { POST as outboundStatusPOST } from '@/app/api/outbound/[id]/status/route';
import { POST as inboundReceivePOST } from '@/app/api/inbound/[id]/receive/route';
import { POST as transferCompletePOST } from '@/app/api/transfers/[id]/complete/route';
import { POST as cycleResolvePOST } from '@/app/api/cycle-counts/[id]/resolve/route';
import { POST as poStatusPOST } from '@/app/api/procurement/[id]/status/route';
import { GET as configUsersGET } from '@/app/api/config/users/route';
import { GET as reportsGET } from '@/app/api/reports/[type]/route';

// Next 16 route handlers await `params` — pass a Promise in the context.
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const typeCtx = (type: string) => ({ params: Promise.resolve({ type }) });

function post(url: string, headers: Record<string, string>, body?: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('auth boundary (route-level HTTP status)', () => {
  beforeEach(() => {
    resetDb();
    resetStock();
    resetLedger();
    resetRequisitions();
    resetPOs();
    resetCycleCounts();
    resetMovements();
    resetReceipts();
    resetTransfers();
  });

  it('requisitions POST returns 401 without x-user-id', async () => {
    const res = await requisitionsCreatePOST(post('http://localhost/api/requisitions', {}));
    expect(res.status).toBe(401);
  });

  it('requisitions POST returns 403 for VIEWER (cannot create)', async () => {
    const res = await requisitionsCreatePOST(
      post('http://localhost/api/requisitions', { 'x-user-id': 'usr-viewer' }, { originId: 'depo-igd', destinationId: 'wh-pusat', priority: 'RUTIN', items: [{ productId: '93000462', qtyRequested: 1 }] })
    );
    expect(res.status).toBe(403);
  });

  it('requisition status POST returns 403 when VIEWER tries to approve', async () => {
    const res = await requisitionStatusPOST(
      post('http://localhost/api/requisitions/REQ-001/status', { 'x-user-id': 'usr-viewer' }, { status: 'APPROVED' }),
      ctx('REQ-001')
    );
    expect(res.status).toBe(403);
  });

  it('outbound status POST returns 401 without x-user-id', async () => {
    const res = await outboundStatusPOST(post('http://localhost/api/outbound/MOV-001/status', {}, { status: 'PICKING' }), ctx('MOV-001'));
    expect(res.status).toBe(401);
  });

  it('inbound receive POST returns 403 for REQUESTOR', async () => {
    const res = await inboundReceivePOST(
      post('http://localhost/api/inbound/RCP-001/receive', { 'x-user-id': 'usr-nurse' }, { destLocationId: 'wh-pusat' }),
      ctx('RCP-001')
    );
    expect(res.status).toBe(403);
  });

  it('transfer complete POST returns 403 for PHARMACIST (not in ASSISTANT/MANAGER/ADMIN)', async () => {
    const res = await transferCompletePOST(post('http://localhost/api/transfers/TRF-001/complete', { 'x-user-id': 'usr-pharmacist' }), ctx('TRF-001'));
    expect(res.status).toBe(403);
  });

  it('cycle-count resolve POST returns 403 for ASSISTANT (needs MANAGER/ADMIN)', async () => {
    const res = await cycleResolvePOST(post('http://localhost/api/cycle-counts/CC-1/resolve', { 'x-user-id': 'usr-staff' }, { reasonCodes: {} }), ctx('CC-1'));
    expect(res.status).toBe(403);
  });

  it('procurement status POST returns 403 when VIEWER tries to approve', async () => {
    // Create a PO in PENDING first so transition path is reached.
    const po = createPO({ supplierName: 'Kimia Farma', items: [{ productId: '93000462', qty: 10, unitPrice: 100, qtyReceived: 0 }] });
    expect(po.ok).toBe(true);
    if (!po.ok) return;
    const res = await poStatusPOST(
      post('http://localhost/api/procurement/PO-1/status', { 'x-user-id': 'usr-viewer' }, { status: 'APPROVED' }),
      ctx(po.po.id)
    );
    expect(res.status).toBe(403);
  });

  it('procurement status POST returns 400 for illegal transition', async () => {
    const res = await poStatusPOST(
      post('http://localhost/api/procurement/PO-1/status', { 'x-user-id': 'usr-admin' }, { status: 'NOT_A_STATUS' }),
      ctx('PO-1')
    );
    expect(res.status).toBe(400);
  });

  it('config/users GET returns 401 without x-user-id and 403 for non-admin', async () => {
    const noAuth = await configUsersGET(new Request('http://localhost/api/config/users'));
    expect(noAuth.status).toBe(401);
    const nonAdmin = await configUsersGET(new Request('http://localhost/api/config/users', { headers: { 'x-user-id': 'usr-manager' } }));
    expect(nonAdmin.status).toBe(403);
  });

  it('reports/[type] GET returns 401 without x-user-id', async () => {
    const res = await reportsGET(new Request('http://localhost/api/reports/expiry'), typeCtx('expiry'));
    expect(res.status).toBe(401);
  });

  it('reports/[type] GET returns 200 for an authenticated active user', async () => {
    const res = await reportsGET(new Request('http://localhost/api/reports/summary', { headers: { 'x-user-id': 'usr-viewer' } }), typeCtx('summary'));
    expect(res.status).toBe(200);
  });

  it('reports/[type] GET returns 400 for unknown type (authenticated)', async () => {
    const res = await reportsGET(new Request('http://localhost/api/reports/bogus', { headers: { 'x-user-id': 'usr-viewer' } }), typeCtx('bogus'));
    expect(res.status).toBe(400);
  });
});
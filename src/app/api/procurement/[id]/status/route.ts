import { ALL_PO_STATUSES, getPOById, updatePOStatus } from '@/api/_fixtures/procurement';
import { getDb } from '@/api/_fixtures/store';
import type { PurchaseOrderStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

// approve/place are manager/buyer; cancel manager/admin.
const REQUIRED_ROLE: Record<string, string[]> = {
  APPROVED: ['MANAGER', 'ADMIN'],
  PLACED: ['BUYER', 'MANAGER', 'ADMIN'],
  CANCELLED: ['MANAGER', 'ADMIN'],
};

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const status = body?.status as PurchaseOrderStatus | undefined;
  if (!status || !ALL_PO_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }
  const po = getPOById(id);
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });

  const allowedRoles = REQUIRED_ROLE[status];
  if (allowedRoles && !allowedRoles.includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot ${status.toLowerCase()}` }, { status: 403 });
  }

  const result = updatePOStatus(id, status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.po);
}
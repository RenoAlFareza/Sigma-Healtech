import { createMovement, listMovements } from '@/api/_fixtures/outbound';
import { getDb } from '@/api/_fixtures/store';
import { canActOnRequisition } from '@/features/requisitions/validation';
import type { MovementStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || undefined) as MovementStatus | undefined;
  const originId = searchParams.get('originId') || undefined;

  const data = listMovements({ status, originId });
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: missing x-user-id header' }, { status: 401 });
  }
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized: invalid user' }, { status: 401 });

  // Outbound creation requires warehouse/staff roles.
  if (!['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot create outbound` }, { status: 403 });
  }

  let body: { originId?: string; destinationId?: string; type?: string; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body?.originId || !body?.destinationId) {
    return NextResponse.json({ error: 'originId and destinationId are required' }, { status: 400 });
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length < 1) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
  }

  const created = createMovement({
    originId: body.originId,
    destinationId: body.destinationId,
    type: body?.type || 'REPLENISHMENT',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items as any[],
  });
  return NextResponse.json(created, { status: 201 });
}
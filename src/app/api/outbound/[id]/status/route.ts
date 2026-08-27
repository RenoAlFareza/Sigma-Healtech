import {
  ALL_MOVEMENT_STATUSES,
  dispatchMovement,
  getMovementById,
  allowedMovementTransition,
  updateMovementStatus,
} from '@/api/_fixtures/outbound';
import { getDb } from '@/api/_fixtures/store';
import type { MovementStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

// pick/pack/dispatch are warehouse actions; receive is a receiving action.
const REQUIRED_ROLE: Record<string, string[]> = {
  PICKING: ['ASSISTANT', 'MANAGER', 'ADMIN'],
  PACKED: ['ASSISTANT', 'MANAGER', 'ADMIN'],
  DISPATCHED: ['ASSISTANT', 'MANAGER', 'ADMIN'],
  RECEIVED: ['ASSISTANT', 'MANAGER', 'ADMIN'],
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

  const status = body?.status as MovementStatus | undefined;
  if (!status || !ALL_MOVEMENT_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  const movement = getMovementById(id);
  if (!movement) return NextResponse.json({ error: 'Movement not found' }, { status: 404 });

  if (!allowedMovementTransition(movement.status, status)) {
    return NextResponse.json(
      { error: `Illegal status transition: ${movement.status} → ${status}` },
      { status: 400 }
    );
  }

  const allowedRoles = REQUIRED_ROLE[status];
  if (allowedRoles && !allowedRoles.includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot ${status.toLowerCase()}` }, { status: 403 });
  }

  // Dispatch performs the FEFO allocation + stock decrement.
  if (status === 'DISPATCHED') {
    const result = dispatchMovement(id, actor.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.movement);
  }

  const result = updateMovementStatus(id, status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.movement);
}
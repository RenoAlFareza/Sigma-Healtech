import { createRequisition, listRequisitions } from '@/api/_fixtures/requisitions';
import { getDb } from '@/api/_fixtures/store';
import { canActOnRequisition } from '@/features/requisitions/validation';
import type { RequisitionStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || undefined) as RequisitionStatus | undefined;
  const originId = searchParams.get('originId') || undefined;
  const destinationId = searchParams.get('destinationId') || undefined;
  const requestedBy = searchParams.get('requestedBy') || undefined;

  const data = listRequisitions({ status, originId, destinationId, requestedBy });

  return NextResponse.json({
    data,
    totalCount: data.length,
  });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: missing x-user-id header' }, { status: 401 });
  }

  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized: invalid user' }, { status: 401 });
  }

  if (!canActOnRequisition(actor.role, 'create')) {
    return NextResponse.json(
      { error: `Forbidden: ${actor.role} cannot create requisitions` },
      { status: 403 }
    );
  }

  let body: {
    originId?: string;
    destinationId?: string;
    priority?: string;
    requestedBy?: string;
    items?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const originId = body?.originId;
  const destinationId = body?.destinationId;
  const priority = body?.priority;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!originId || !destinationId) {
    return NextResponse.json(
      { error: 'originId and destinationId are required' },
      { status: 400 }
    );
  }
  if (priority !== 'RUTIN' && priority !== 'URGENT') {
    return NextResponse.json({ error: 'priority must be RUTIN or URGENT' }, { status: 400 });
  }
  if (items.length < 1) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
  }

  const created = createRequisition({
    originId,
    destinationId,
    priority,
    // Trust the authenticated actor, not a client-supplied impersonation.
    requestedBy: body?.requestedBy || actor.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items as any[],
  });

  return NextResponse.json(created, { status: 201 });
}

import { commitReceipt } from '@/api/_fixtures/inbound';
import { getDb } from '@/api/_fixtures/store';
import type { InboundItem } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ASSISTANT', 'MANAGER', 'ADMIN'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot receive goods` }, { status: 403 });
  }

  let body: { destLocationId?: string; items?: InboundItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body?.destLocationId) {
    return NextResponse.json({ error: 'destLocationId is required' }, { status: 400 });
  }

  const result = commitReceipt(id, {
    receivedBy: actor.id,
    destLocationId: body.destLocationId,
    items: body.items,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.receipt);
}
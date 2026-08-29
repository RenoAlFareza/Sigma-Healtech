import { createReceipt, listReceipts } from '@/api/_fixtures/inbound';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const destinationLocationId = searchParams.get('destinationLocationId') || undefined;
  const data = listReceipts({ status: status as never, destinationLocationId });
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot create inbound` }, { status: 403 });
  }

  let body: { sourceType?: string; referenceId?: string; destinationLocationId?: string; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length < 1) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
  }

  const created = createReceipt({
    sourceType: body?.sourceType || 'SUPPLIER',
    referenceId: body?.referenceId,
    destinationLocationId: body?.destinationLocationId || actor.defaultLocationId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: items as any[],
  });
  return NextResponse.json(created, { status: 201 });
}

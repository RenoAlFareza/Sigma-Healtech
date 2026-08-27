import { createCycleCount, listCycleCounts } from '@/api/_fixtures/cycleCounts';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const locationId = searchParams.get('locationId') || undefined;
  const data = listCycleCounts({ status: status as never, locationId });
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['MANAGER', 'ADMIN'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot create cycle count` }, { status: 403 });
  }

  let body: { locationId?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body?.locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });

  const result = createCycleCount({ locationId: body.locationId, category: body.category });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.count, { status: 201 });
}
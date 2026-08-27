import { getCycleCountById, submitCount } from '@/api/_fixtures/cycleCounts';
import { getDb } from '@/api/_fixtures/store';
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
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot submit counts` }, { status: 403 });
  }

  if (!getCycleCountById(id)) return NextResponse.json({ error: 'Cycle count not found' }, { status: 404 });

  let body: { entries?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entries = (body?.entries ?? []) as any[];

  const result = submitCount(id, entries);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.count);
}
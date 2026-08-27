import { getCycleCountById, resolveCycleCount } from '@/api/_fixtures/cycleCounts';
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
  if (!['MANAGER', 'ADMIN'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot resolve cycle counts` }, { status: 403 });
  }

  if (!getCycleCountById(id)) return NextResponse.json({ error: 'Cycle count not found' }, { status: 404 });

  let body: { reasonCodes?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const result = resolveCycleCount(id, { user: actor.id, reasonCodes: body?.reasonCodes ?? {} });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.count);
}
import { getPOById, recordPOReceipt } from '@/api/_fixtures/procurement';
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
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot receive PO` }, { status: 403 });
  }
  if (!getPOById(id)) return NextResponse.json({ error: 'PO not found' }, { status: 404 });

  let body: { lines?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = (body?.lines ?? []) as any[];

  const result = recordPOReceipt(id, lines);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.po);
}
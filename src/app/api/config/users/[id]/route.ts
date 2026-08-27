import { updateUser } from '@/api/_fixtures/config';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

function isAdmin(userId: string): boolean {
  const { users } = getDb();
  const u = users.find((x) => x.id === userId || x.username === userId);
  return u?.role === 'ADMIN';
}

export async function PUT(request: Request, { params }: RouteContext) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });

  const { id } = await params;
  let body: { name?: string; role?: string; defaultLocationId?: string; locationIds?: string[]; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const result = updateUser(id, body as never);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.data);
}
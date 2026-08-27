import { createUser, listUsers } from '@/api/_fixtures/config';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

function isAdmin(userId: string): boolean {
  const { users } = getDb();
  const u = users.find((x) => x.id === userId || x.username === userId);
  return u?.role === 'ADMIN';
}

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
  const data = listUsers();
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });

  let body: { username?: string; name?: string; role?: string; defaultLocationId?: string; locationIds?: string[]; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body?.username || !body?.name || !body?.role || !body?.defaultLocationId) {
    return NextResponse.json({ error: 'username, name, role and defaultLocationId are required' }, { status: 400 });
  }
  const result = createUser({
    username: body.username,
    name: body.name,
    role: body.role as never,
    defaultLocationId: body.defaultLocationId,
    locationIds: body.locationIds ?? [],
    active: body.active,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}
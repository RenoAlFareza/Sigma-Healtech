import { createLocation, listLocations } from '@/api/_fixtures/config';
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
  const data = listLocations();
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(userId)) return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });

  let body: { name?: string; code?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body?.name || !body?.code || !body?.type) {
    return NextResponse.json({ error: 'name, code and type are required' }, { status: 400 });
  }
  const result = createLocation({ name: body.name, code: body.code, type: body.type as never });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}
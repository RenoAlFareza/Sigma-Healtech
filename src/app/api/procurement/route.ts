import { createPO, listPOs } from '@/api/_fixtures/procurement';
import { getDb } from '@/api/_fixtures/store';
import type { PurchaseOrderStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get('status') || undefined) as PurchaseOrderStatus | undefined;
  const data = listPOs({ status });
  return NextResponse.json({ data, totalCount: data.length });
}

export async function POST(request: Request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['BUYER', 'MANAGER', 'ADMIN'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot create PO` }, { status: 403 });
  }

  let body: { supplierName?: string; items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!body?.supplierName) return NextResponse.json({ error: 'supplierName is required' }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (body?.items ?? []) as any[];

  const result = createPO({ supplierName: body.supplierName, items });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.po, { status: 201 });
}
import { getPOById } from '@/api/_fixtures/procurement';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const po = getPOById(id);
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });
  return NextResponse.json(po);
}
import { getCycleCountById } from '@/api/_fixtures/cycleCounts';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const count = getCycleCountById(id);
  if (!count) return NextResponse.json({ error: 'Cycle count not found' }, { status: 404 });
  return NextResponse.json(count);
}
import { getMovementById } from '@/api/_fixtures/outbound';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const movement = getMovementById(id);
  if (!movement) return NextResponse.json({ error: 'Movement not found' }, { status: 404 });
  return NextResponse.json(movement);
}
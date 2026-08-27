import { getTransferById } from '@/api/_fixtures/transfers';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const transfer = getTransferById(id);
  if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  return NextResponse.json(transfer);
}
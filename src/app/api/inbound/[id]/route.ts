import { getReceiptById } from '@/api/_fixtures/inbound';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const receipt = getReceiptById(id);
  if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
  return NextResponse.json(receipt);
}
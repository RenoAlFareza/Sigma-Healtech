import { getRequisitionById } from '@/api/_fixtures/requisitions';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const requisition = getRequisitionById(id);

  if (!requisition) {
    return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
  }

  return NextResponse.json(requisition);
}
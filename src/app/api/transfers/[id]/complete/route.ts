import { completeTransfer, getTransferById, allowedTransferTransition } from '@/api/_fixtures/transfers';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ASSISTANT', 'MANAGER', 'ADMIN'].includes(actor.role)) {
    return NextResponse.json({ error: `Forbidden: ${actor.role} cannot complete transfers` }, { status: 403 });
  }

  const transfer = getTransferById(id);
  if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  if (!allowedTransferTransition(transfer.status, 'COMPLETED')) {
    return NextResponse.json({ error: `Illegal transition: ${transfer.status} → COMPLETED` }, { status: 400 });
  }

  const result = completeTransfer(id, actor.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.transfer);
}
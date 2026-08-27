import { getRequisitionById, updateRequisitionStatus } from '@/api/_fixtures/requisitions';
import { getDb } from '@/api/_fixtures/store';
import {
  ALL_REQUISITION_STATUSES,
  allowedTransitions,
  canActOnRequisition,
} from '@/features/requisitions/validation';
import type { RequisitionStatus } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

type RequisitionAction = 'approve' | 'reject' | 'pick' | 'issue';

/** Map a raw status string to the action a manager/staff intends to perform. */
function actionForTransition(from: RequisitionStatus, to: RequisitionStatus): RequisitionAction {
  if (to === 'APPROVED') return 'approve';
  if (to === 'REJECTED') return 'reject';
  if (to === 'PICKING') return 'pick';
  if (to === 'ISSUED') return 'issue';
  // Rollback/undo transitions are handled by the role of the current actor's
  // intent — default to 'approve' gate only when it's a manager-ish action.
  return 'issue';
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: missing x-user-id header' }, { status: 401 });
  }

  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized: invalid user' }, { status: 401 });
  }

  let body: { status?: string; reason?: string; itemAdjustments?: { productId: string; qtyApproved: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const status = body?.status as RequisitionStatus | undefined;
  if (!status || !ALL_REQUISITION_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  const requisition = getRequisitionById(id);
  if (!requisition) {
    return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
  }

  // 1) Transition legality.
  if (!allowedTransitions(requisition.status, status)) {
    return NextResponse.json(
      { error: `Illegal status transition: ${requisition.status} → ${status}` },
      { status: 400 }
    );
  }

  // 2) Role authorization for the action implied by the target status.
  const action = actionForTransition(requisition.status, status);
  if (!canActOnRequisition(actor.role, action)) {
    return NextResponse.json(
      { error: `Forbidden: ${actor.role} cannot perform this action` },
      { status: 403 }
    );
  }

  const result = updateRequisitionStatus(id, status, {
    reason: body?.reason,
    itemAdjustments: body?.itemAdjustments,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.requisition);
}
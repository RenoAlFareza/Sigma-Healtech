import type { RequisitionStatus, Role } from '@/shared/types/domain';

export type RequisitionAction = 'approve' | 'reject' | 'pick' | 'issue' | 'create';

/**
 * Legal state transitions for a requisition (PRD §7.9), plus rollback/undo
 * edges to allow moving back to a previous state.
 *
 * CREATED → SUBMITTED
 * SUBMITTED → APPROVED | REJECTED | CANCELED
 * APPROVED → PICKING | REJECTED | SUBMITTED (undo)
 * PICKING → ISSUED | REJECTED | APPROVED (undo)
 * ISSUED → RECEIVED | CANCELED | PICKING (undo)
 * RECEIVED → (terminal, but allow undo to ISSUED)
 */
export const REQUISITION_TRANSITIONS: Record<RequisitionStatus, RequisitionStatus[]> = {
  CREATED: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKING', 'REJECTED', 'SUBMITTED'],
  PICKING: ['ISSUED', 'REJECTED', 'APPROVED'],
  ISSUED: ['RECEIVED', 'CANCELED', 'PICKING'],
  REJECTED: ['CREATED'],
  RECEIVED: ['ISSUED'],
  CANCELED: [],
};

/** List of all legal status targets (used for input validation in routes). */
export const ALL_REQUISITION_STATUSES = Object.keys(REQUISITION_TRANSITIONS) as RequisitionStatus[];

/** True if `from → to` is a legal transition. */
export function allowedTransitions(from: RequisitionStatus, to: RequisitionStatus): boolean {
  if (from === to) return true; // no-op is allowed
  return REQUISITION_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Role-based authorization for requisition actions.
 * Centralised so both the UI wall and the API routes agree.
 */
export function canActOnRequisition(
  role: Role | null | undefined,
  action: RequisitionAction,
  currentStatus?: RequisitionStatus
): boolean {
  switch (action) {
    case 'create':
      return (
        role === 'REQUESTOR' ||
        role === 'PHARMACIST' ||
        role === 'MANAGER' ||
        role === 'ADMIN' ||
        role === 'ASSISTANT'
      );
    case 'approve':
    case 'reject':
      return role === 'MANAGER' || role === 'ADMIN';
    case 'pick':
    case 'issue':
      return role === 'ASSISTANT' || role === 'MANAGER' || role === 'ADMIN';
    default:
      return false;
  }
}

/** Human-readable description of a transition rule for error messages. */
export function transitionErrorMessage(from: RequisitionStatus, to: RequisitionStatus): string {
  if (allowedTransitions(from, to)) return '';
  const allowed = REQUISITION_TRANSITIONS[from] ?? [];
  const allowedList = allowed.length ? allowed.join(', ') : '(none)';
  return `Illegal status transition: ${from} → ${to} (allowed: ${allowedList})`;
}
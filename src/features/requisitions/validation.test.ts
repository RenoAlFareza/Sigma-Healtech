import { describe, it, expect } from 'vitest';
import {
  allowedTransitions,
  canActOnRequisition,
  transitionErrorMessage,
  REQUISITION_TRANSITIONS,
} from './validation';

describe('allowedTransitions (transition legality matrix)', () => {
  it('allows the happy-path forward chain', () => {
    expect(allowedTransitions('CREATED', 'SUBMITTED')).toBe(true);
    expect(allowedTransitions('SUBMITTED', 'APPROVED')).toBe(true);
    expect(allowedTransitions('APPROVED', 'PICKING')).toBe(true);
    expect(allowedTransitions('PICKING', 'ISSUED')).toBe(true);
    expect(allowedTransitions('ISSUED', 'RECEIVED')).toBe(true);
  });

  it('rejects illegal forward jumps', () => {
    expect(allowedTransitions('CREATED', 'APPROVED')).toBe(false);
    expect(allowedTransitions('CREATED', 'ISSUED')).toBe(false);
    expect(allowedTransitions('SUBMITTED', 'ISSUED')).toBe(false);
    expect(allowedTransitions('APPROVED', 'ISSUED')).toBe(false);
    // terminal-ish: nothing forward from RECEIVED except undo
    expect(allowedTransitions('RECEIVED', 'RECEIVED')).toBe(true);
  });

  it('allows rejection from SUBMITTED and APPROVED, and undo/rollback', () => {
    expect(allowedTransitions('SUBMITTED', 'REJECTED')).toBe(true);
    expect(allowedTransitions('APPROVED', 'REJECTED')).toBe(true);
    expect(allowedTransitions('PICKING', 'REJECTED')).toBe(true);
    // rollback
    expect(allowedTransitions('APPROVED', 'SUBMITTED')).toBe(true);
    expect(allowedTransitions('PICKING', 'APPROVED')).toBe(true);
    expect(allowedTransitions('ISSUED', 'PICKING')).toBe(true);
  });

  it('treats same-state as allowed (no-op)', () => {
    expect(allowedTransitions('CREATED', 'CREATED')).toBe(true);
    expect(allowedTransitions('ISSUED', 'ISSUED')).toBe(true);
  });

  it('produces a clear error message for illegal transitions', () => {
    const msg = transitionErrorMessage('CREATED', 'APPROVED');
    expect(msg).toContain('CREATED → APPROVED');
    expect(msg).toContain('SUBMITTED');
  });

  it('defines an entry for every known status', () => {
    const statuses = ['CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PICKING', 'ISSUED', 'RECEIVED', 'CANCELED'];
    for (const s of statuses) {
      expect(REQUISITION_TRANSITIONS[s as never]).toBeDefined();
    }
  });
});

describe('canActOnRequisition (role authorization)', () => {
  it('create is denied for VIEWER and BUYER-only roles', () => {
    expect(canActOnRequisition('VIEWER', 'create')).toBe(false);
    expect(canActOnRequisition('BUYER', 'create')).toBe(false);
    expect(canActOnRequisition(null, 'create')).toBe(false);
  });

  it('create is allowed for requester/staff/manager roles', () => {
    expect(canActOnRequisition('REQUESTOR', 'create')).toBe(true);
    expect(canActOnRequisition('PHARMACIST', 'create')).toBe(true);
    expect(canActOnRequisition('MANAGER', 'create')).toBe(true);
    expect(canActOnRequisition('ASSISTANT', 'create')).toBe(true);
  });

  it('approve/reject require MANAGER or ADMIN', () => {
    expect(canActOnRequisition('MANAGER', 'approve')).toBe(true);
    expect(canActOnRequisition('ADMIN', 'approve')).toBe(true);
    expect(canActOnRequisition('ASSISTANT', 'approve')).toBe(false);
    expect(canActOnRequisition('REQUESTOR', 'approve')).toBe(false);
    expect(canActOnRequisition('BUYER', 'issue')).toBe(false);
  });

  it('pick/issue require ASSISTANT/MANAGER/ADMIN', () => {
    expect(canActOnRequisition('ASSISTANT', 'issue')).toBe(true);
    expect(canActOnRequisition('MANAGER', 'pick')).toBe(true);
    expect(canActOnRequisition('ADMIN', 'issue')).toBe(true);
    expect(canActOnRequisition('REQUESTOR', 'issue')).toBe(false);
    expect(canActOnRequisition('PHARMACIST', 'issue')).toBe(false);
  });
});
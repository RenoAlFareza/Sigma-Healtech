import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { Requisition } from '@/shared/types/domain';

const mockList = vi.fn();
const mockPush = vi.fn();

vi.mock('@/features/requisitions/api', () => ({
  listRequisitions: (...args: unknown[]) => mockList(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RequisitionList } from './RequisitionList';

const req = (overrides: Partial<Requisition> = {}): Requisition => ({
  id: 'REQ-001',
  requestNumber: 'REQ-2026-RQ-1001',
  originId: 'depo-rawat-inap',
  destinationId: 'wh-pusat',
  requestedBy: 'usr-pharmacist',
  priority: 'RUTIN',
  status: 'SUBMITTED',
  items: [{ productId: '93000462', qtyRequested: 20 }],
  createdAt: '2026-08-01T08:00:00Z',
  ...overrides,
});

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('RequisitionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ data: [req()], totalCount: 1 });
  });

  it('renders requisition rows after loading', async () => {
    mockUseAuth.mockReturnValue({
      role: 'MANAGER',
      user: { id: 'usr-manager', name: 'Manager', role: 'MANAGER' },
    });
    render(<RequisitionList />);
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('REQ-2026-RQ-1001')).toBeInTheDocument();
    });
  });

  it('filters by origin for MANAGER', async () => {
    mockUseAuth.mockReturnValue({
      role: 'MANAGER',
      user: { id: 'usr-manager', name: 'Manager', role: 'MANAGER' },
    });
    render(<RequisitionList />);
    await flushPromises();

    expect(mockList).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ requestedBy: expect.anything() })
    );
  });

  it('REQUESTOR sees only requisitions they requested (requestedBy = user.id)', async () => {
    const myReqs = [
      req({ id: 'REQ-001', requestNumber: 'REQ-2026-RQ-1001', requestedBy: 'usr-pharmacist' }),
    ];
    mockList.mockResolvedValue({ data: myReqs, totalCount: 1 });

    mockUseAuth.mockReturnValue({
      role: 'REQUESTOR',
      user: { id: 'usr-pharmacist', name: 'Apoteker', role: 'REQUESTOR' },
    });
    render(<RequisitionList />);
    await flushPromises();

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.objectContaining({ requestedBy: 'usr-pharmacist' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('REQ-2026-RQ-1001')).toBeInTheDocument();
    });
    // No origin filter select shown for requester-scoped views.
    expect(screen.queryByLabelText(/unit asal/i)).not.toBeInTheDocument();
  });

  it('renders an empty state when there are no requisitions', async () => {
    mockUseAuth.mockReturnValue({
      role: 'MANAGER',
      user: { id: 'usr-manager', name: 'Manager', role: 'MANAGER' },
    });
    mockList.mockResolvedValue({ data: [], totalCount: 0 });
    render(<RequisitionList />);
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText(/tidak ada permintaan/i)).toBeInTheDocument();
    });
  });
});
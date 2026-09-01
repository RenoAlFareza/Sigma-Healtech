import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Requisition } from '@/shared/types/domain';

const mockGet = vi.fn();
const mockTransition = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

vi.mock('@/features/requisitions/api', () => ({
  getRequisition: (...args: unknown[]) => mockGet(...args),
  transitionStatus: (...args: unknown[]) => mockTransition(...args),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

const mockUseAuth = vi.fn();
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RequisitionDetail } from './RequisitionDetail';

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

function renderDetail(role: string, data: Requisition) {
  mockUseAuth.mockReturnValue({ role, user: { id: 'u', name: 'U', role } });
  mockGet.mockResolvedValue(data);
  return render(<RequisitionDetail id="REQ-001" />);
}

describe('RequisitionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(req());
    mockTransition.mockResolvedValue(req({ status: 'APPROVED' }));
  });

  it('renders the requisition header and items', async () => {
    renderDetail('REQUESTOR', req());
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('REQ-2026-RQ-1001')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/depo-rawat-inap/i)[0]).toBeInTheDocument();
  });

  it('shows Approve/Reject actions for MANAGER on SUBMITTED', async () => {
    renderDetail('MANAGER', req());
    await flushPromises();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /setujui/i })[0]).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /tolak/i })[0]).toBeInTheDocument();
  });

  it('approve action transitions to APPROVED for MANAGER', async () => {
    renderDetail('MANAGER', req());
    await flushPromises();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /setujui/i })[0]).toBeInTheDocument();
    });
    await userEvent.click(screen.getAllByRole('button', { name: /setujui/i })[0]);

    await waitFor(() => {
      expect(mockTransition).toHaveBeenCalledWith('REQ-001', { status: 'APPROVED' });
    });
  });

  it('shows issue action for ASSISTANT on APPROVED', async () => {
    renderDetail('ASSISTANT', req({ status: 'APPROVED' }));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /proses pengeluaran/i })[0]).toBeInTheDocument();
    });
  });

  it('is read-only for REQUESTOR, no action buttons', async () => {
    renderDetail('REQUESTOR', req({ status: 'APPROVED' }));
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('REQ-2026-RQ-1001')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /setujui|proses pengeluaran|tolak/i })).not.toBeInTheDocument();
  });
});
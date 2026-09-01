import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockGetTransfer = vi.fn();
const mockComplete = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/transfers/api', () => ({
  getTransfer: (...a: unknown[]) => mockGetTransfer(...a),
  completeTransfer: (...a: unknown[]) => mockComplete(...a),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'usr-staff', name: 'Staff', role: 'ASSISTANT' }, role: 'ASSISTANT' }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'TRF-001' }),
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { TransferDetail } from './TransferDetail';

const dummyTransfer = {
  id: 'TRF-001',
  transferNumber: 'TRF-2026-7001',
  originId: 'wh-pusat',
  destinationId: 'depo-rawat-inap',
  status: 'APPROVED' as const,
  items: [
    { productId: '93000462', lot: 'LOT-2026-001', qty: 25 },
    { productId: '93012826', lot: 'LOT-2026-004', qty: 15 },
  ],
  createdAt: '2026-09-01T10:00:00Z',
};

describe('TransferDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransfer.mockResolvedValue(dummyTransfer);
    mockComplete.mockResolvedValue({ ...dummyTransfer, status: 'COMPLETED' });
  });

  it('renders transfer document information and items', async () => {
    render(<TransferDetail />);
    await waitFor(() => {
      expect(screen.getByText('TRF-2026-7001')).toBeInTheDocument();
    });
    expect(screen.getByText('LOT-2026-001')).toBeInTheDocument();
    expect(screen.getByText('LOT-2026-004')).toBeInTheDocument();
    expect(screen.getByText(/wh-pusat/i)).toBeInTheDocument();
    expect(screen.getByText(/depo-rawat-inap/i)).toBeInTheDocument();
  });

  it('allows completing transfer when status is APPROVED', async () => {
    render(<TransferDetail />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /konfirmasi penerimaan stok/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /konfirmasi penerimaan stok/i }));
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('TRF-001');
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});

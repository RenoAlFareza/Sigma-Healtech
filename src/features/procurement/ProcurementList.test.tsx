import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockList = vi.fn();
const mockPush = vi.fn();

vi.mock('@/features/procurement/api', () => ({
  listPOs: (...a: unknown[]) => mockList(...a),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ role: 'BUYER' }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { ProcurementList } from './ProcurementList';

const dummyPOs = [
  {
    id: 'PO-001',
    poNumber: 'PO-2026-11001',
    supplierName: 'PT Kimia Farma Trading & Distribution',
    status: 'APPROVED',
    items: [
      { productId: '93000462', qty: 500, unitPrice: 450, qtyReceived: 0 },
    ],
    total: 225000,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'PO-002',
    poNumber: 'PO-2026-11002',
    supplierName: 'PT Kalbe Farma Tbk',
    status: 'RECEIVED',
    items: [
      { productId: '93000464', qty: 400, unitPrice: 1500, qtyReceived: 400 },
    ],
    total: 600000,
    createdAt: '2026-08-25T10:00:00Z',
  },
];

describe('ProcurementList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ data: dummyPOs, totalCount: 2 });
  });

  it('renders 3 Bento KPI cards and PO table rows', async () => {
    render(<ProcurementList />);
    await waitFor(() => {
      expect(screen.getByText('PO-2026-11001')).toBeInTheDocument();
      expect(screen.getByText('PO-2026-11002')).toBeInTheDocument();
    });
    expect(screen.getAllByText('PT Kimia Farma Trading & Distribution').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PT Kalbe Farma Tbk').length).toBeGreaterThan(0);
  });

  it('filters PO rows by supplier and status', async () => {
    render(<ProcurementList />);
    await waitFor(() => {
      expect(screen.getByText('PO-2026-11001')).toBeInTheDocument();
    });

    const supplierSelect = screen.getByLabelText(/Distributor \/ Pemasok/i);
    fireEvent.change(supplierSelect, { target: { value: 'PT Kalbe Farma Tbk' } });
    fireEvent.click(screen.getByRole('button', { name: /terapkan filter/i }));

    await waitFor(() => {
      expect(screen.queryByText('PO-2026-11001')).not.toBeInTheDocument();
      expect(screen.getByText('PO-2026-11002')).toBeInTheDocument();
    });
  });

  it('navigates to create new PO when clicking Buat PO Baru', async () => {
    render(<ProcurementList />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buat po baru/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /buat po baru/i }));
    expect(mockPush).toHaveBeenCalledWith('/procurement/new');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCreate = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/requisitions/api', () => ({
  createRequisition: (...args: unknown[]) => mockCreate(...args),
}));

const mockListProducts = vi.fn();
vi.mock('@/features/products/api', () => ({
  listProducts: (...args: unknown[]) => mockListProducts(...args),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'depo-rawat-inap', setActiveLocationId: vi.fn() }),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'usr-pharmacist', name: 'Apoteker', role: 'PHARMACIST' },
    role: 'PHARMACIST',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

import { RequisitionCreate } from './RequisitionCreate';

describe('RequisitionCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'REQ-NEW' });
    mockListProducts.mockResolvedValue({
      data: [{ id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', zatAktif: '', kekuatan: '', dosageForm: '', nie: '', manufacturer: '', price: 5000, uom: 'Tablet', category: 'Analgesik' }],
      totalCount: 1,
    });
  });

  it('renders the form header with origin from active location', () => {
    render(<RequisitionCreate />);
    expect(screen.getByLabelText(/unit asal/i)).toHaveValue('depo-rawat-inap');
    expect(screen.getByLabelText(/prioritas/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting with no line items', async () => {
    render(<RequisitionCreate />);
    await userEvent.click(screen.getByRole('button', { name: /kirim permintaan/i }));
    expect(mockCreate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/minimal satu item/i)).toBeInTheDocument();
    });
  });

  it('adds a product line item and submits to createRequisition', async () => {
    render(<RequisitionCreate />);

    // Add a product via the search input
    await userEvent.type(screen.getByLabelText(/cari produk/i), 'Paracetamol');
    await userEvent.click(screen.getByRole('button', { name: /tambah item/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/paracetamol/i).length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getByRole('button', { name: /kirim permintaan/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    const payload = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.originId).toBe('depo-rawat-inap');
    expect(payload.destinationId).toBe('wh-pusat');
    expect(Array.isArray(payload.items)).toBe(true);
    expect((payload.items as unknown[]).length).toBeGreaterThan(0);
  });
});
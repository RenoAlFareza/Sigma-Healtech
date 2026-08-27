import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCreate = vi.fn();
const mockTransition = vi.fn();
const mockListInventory = vi.fn();
const mockListProducts = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/outbound/api', () => ({
  createOutbound: (...a: unknown[]) => mockCreate(...a),
  transitionOutboundStatus: (...a: unknown[]) => mockTransition(...a),
}));

vi.mock('@/features/inventory/api', () => ({
  listInventory: (...a: unknown[]) => mockListInventory(...a),
}));

vi.mock('@/features/products/api', () => ({
  listProducts: (...a: unknown[]) => mockListProducts(...a),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'usr-staff', name: 'Staff', role: 'ASSISTANT' }, role: 'ASSISTANT' }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { OutboundNew } from './OutboundNew';

const stockLot = {
  id: 'l1',
  product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', zatAktif: '', kekuatan: '', dosageForm: '', nie: '', manufacturer: '', price: 0, uom: '', category: '' },
  locationId: 'wh-pusat',
  lot: 'LOT-2026-001',
  expiry: '2027-01-01',
  qtyOnHand: 100,
  bin: 'Z-A1',
  status: 'IN_STOCK',
};

const catalogProducts = [
  { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', zatAktif: '', kekuatan: '', dosageForm: '', nie: '', manufacturer: '', price: 5000, uom: 'Tablet', category: 'Analgesik' },
];

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('OutboundNew', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'MOV-NEW', movementNumber: 'OUT-2026-5002' });
    mockTransition.mockImplementation(async (_id: string, status: string) => ({ id: 'MOV-NEW', movementNumber: 'OUT-2026-5002', status }));
    mockListInventory.mockResolvedValue({ data: [stockLot], totalCount: 1 });
    mockListProducts.mockResolvedValue({ data: catalogProducts, totalCount: 1 });
  });

  it('renders the first wizard step (header)', () => {
    render(<OutboundNew />);
    expect(screen.getByLabelText(/unit asal/i)).toHaveValue('wh-pusat');
    expect(screen.getByLabelText(/jenis/i)).toBeInTheDocument();
  });

  it('adds a product item in the items step', async () => {
    render(<OutboundNew />);
    // Go to items step
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    await waitFor(() => expect(screen.getByLabelText(/cari produk/i)).toBeInTheDocument());
    const addBtn = screen.getByRole('button', { name: /93000462/i });
    await userEvent.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();
    });
  });

  it('blocks dispatch when stock is insufficient', async () => {
    mockListInventory.mockResolvedValue({ data: [], totalCount: 0 });
    render(<OutboundNew />);
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    await waitFor(() => expect(screen.getByLabelText(/cari produk/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /93000462/i }));
    // items → review
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    // review → next triggers validateStock (fails, no lots) and stays on review
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('proceeds through wizard and dispatches, calling createOutbound + transitions', async () => {
    render(<OutboundNew />);
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    await waitFor(() => expect(screen.getByLabelText(/cari produk/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /93000462/i }));
    // items valid → next to review
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    await flush();
    // review valid → next to pick
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    // pick → pack
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    // pack → dispatch
    await userEvent.click(screen.getByRole('button', { name: /next step/i }));
    // dispatch is last → onComplete
    await userEvent.click(screen.getByRole('button', { name: /kirim outbound/i }));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    // Dispatch transitions called for PICKING and DISPATCHED
    expect(mockTransition).toHaveBeenCalledWith(
      expect.anything(),
      'DISPATCHED'
    );
    expect(mockPush).toHaveBeenCalledWith('/outbound');
  });
});
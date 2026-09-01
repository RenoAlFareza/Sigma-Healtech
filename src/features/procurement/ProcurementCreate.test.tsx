import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockCreate = vi.fn();
const mockListProducts = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/procurement/api', () => ({
  createPO: (...a: unknown[]) => mockCreate(...a),
}));

vi.mock('@/features/products/api', () => ({
  listProducts: (...a: unknown[]) => mockListProducts(...a),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { ProcurementCreate } from './ProcurementCreate';

const catalog = [
  { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg', zatAktif: '', kekuatan: '', dosageForm: '', nie: '', manufacturer: '', price: 5000, uom: 'Tablet', category: 'Analgesik' },
];

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('ProcurementCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'PO-NEW', poNumber: 'PO-2026-11002' });
    mockListProducts.mockResolvedValue({ data: catalog, totalCount: 1 });
  });

  it('validates at least one item', async () => {
    render(<ProcurementCreate />);
    await flush();
    const buttons = screen.getAllByRole('button', { name: /terbitkan purchase order|buat po/i });
    fireEvent.click(buttons[0]);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('adds items from catalog and creates the PO with total', async () => {
    render(<ProcurementCreate />);
    await flush();
    await waitFor(() => expect(screen.getByRole('button', { name: /93000462/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /93000462/i }));
    await waitFor(() => expect(screen.getAllByText('Paracetamol 500 mg').length).toBeGreaterThan(0));
    const buttons = screen.getAllByRole('button', { name: /terbitkan purchase order|buat po/i });
    fireEvent.click(buttons[0]);
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });
    const payload = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.supplierName).toBeTruthy();
    expect(Array.isArray(payload.items)).toBe(true);
    expect((payload.items as unknown[]).length).toBeGreaterThan(0);
  });
});
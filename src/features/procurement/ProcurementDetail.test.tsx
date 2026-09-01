import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGet = vi.fn();
const mockReceive = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ role: 'MANAGER' }),
}));

vi.mock('@/features/procurement/api', () => ({
  getPO: (...a: unknown[]) => mockGet(...a),
  recordPOReceipt: (...a: unknown[]) => mockReceive(...a),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { ProcurementDetail } from './ProcurementDetail';

const po = {
  id: 'PO-1',
  poNumber: 'PO-2026-11001',
  supplierName: 'Kimia Farma',
  status: 'PLACED',
  items: [{ productId: '93000462', qty: 100, unitPrice: 5000, qtyReceived: 0 }],
  total: 500000,
  createdAt: '2026-08-01T08:00:00Z',
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('ProcurementDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(po);
    mockReceive.mockResolvedValue({ ...po, status: 'PARTIALLY_RECEIVED', items: [{ ...po.items[0], qtyReceived: 40 }] });
  });

  it('records a receipt and calls recordPOReceipt', async () => {
    render(<ProcurementDetail id="PO-1" />);
    await flush();
    await waitFor(() => expect(screen.getByRole('button', { name: /catat penerimaan/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /catat penerimaan/i }));
    await waitFor(() => {
      expect(mockReceive).toHaveBeenCalled();
    });
    const [cid, lines] = mockReceive.mock.calls[0] as [string, { productId: string }[]];
    expect(cid).toBe('PO-1');
    expect(lines[0].productId).toBe('93000462');
  });
});

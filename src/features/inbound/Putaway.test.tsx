import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { InboundReceipt } from '@/shared/types/domain';

const mockGet = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

vi.mock('@/features/inbound/api', () => ({
  getInbound: (...a: unknown[]) => mockGet(...a),
  commitInbound: vi.fn(),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { Putaway } from './Putaway';

const receipt: InboundReceipt = {
  id: 'RCP-001',
  receiptNumber: 'IN-2026-3001',
  sourceType: 'SUPPLIER',
  status: 'COMPLETED',
  items: [{ productId: '93000462', qtyExpected: 50, qtyReceived: 50, lot: 'LOT-IN-001', expiry: '2028-01-01', bin: '' }],
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('Putaway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(receipt);
  });

  it('renders received lines requiring a target bin', async () => {
    render(<Putaway id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/bin tujuan/i)).toBeInTheDocument());
    expect(screen.getByText('LOT-IN-001')).toBeInTheDocument();
  });

  it('rejects save when a bin is missing', async () => {
    render(<Putaway id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getAllByRole('button', { name: /simpan putaway/i })[0]).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: /simpan putaway/i })[0]);
    expect(mockToast.error).toHaveBeenCalled();
  });

  it('accepts bin input and saves', async () => {
    render(<Putaway id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/bin tujuan/i)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/bin tujuan/i), { target: { value: 'Z-A9' } });
    fireEvent.click(screen.getAllByRole('button', { name: /simpan putaway/i })[0]);
    expect(mockToast.success).toHaveBeenCalled();
  });
});
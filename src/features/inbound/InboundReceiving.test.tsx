import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InboundReceipt } from '@/shared/types/domain';

const mockGet = vi.fn();
const mockCommit = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/inbound/api', () => ({
  getInbound: (...a: unknown[]) => mockGet(...a),
  commitInbound: (...a: unknown[]) => mockCommit(...a),
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

import { InboundReceiving } from './InboundReceiving';

const receipt: InboundReceipt = {
  id: 'RCP-001',
  receiptNumber: 'IN-2026-3001',
  sourceType: 'SUPPLIER',
  status: 'CREATED',
  items: [
    { productId: '93000462', qtyExpected: 100, lot: 'LOT-IN-001', expiry: '2028-01-01', bin: 'Z-A1' },
  ],
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('InboundReceiving', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(receipt);
    mockCommit.mockResolvedValue({ ...receipt, status: 'COMPLETED' });
  });

  it('loads lines and commits, calling commitInbound with received qty', async () => {
    render(<InboundReceiving id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/diterima/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /terima barang/i }));

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalled();
    });
    const [cid, payload] = mockCommit.mock.calls[0] as [string, { destLocationId: string; items: unknown[] }];
    expect(cid).toBe('RCP-001');
    expect(payload.destLocationId).toBe('wh-pusat');
  });

  it('blocks commit when lot is empty', async () => {
    const noLot = { ...receipt, items: [{ ...receipt.items[0], lot: '' }] };
    mockGet.mockResolvedValue(noLot);
    render(<InboundReceiving id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/diterima/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /terima barang/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it('allows partial receipt by editing received qty value', async () => {
    render(<InboundReceiving id="RCP-001" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/diterima/i)).toBeInTheDocument());

    const qtyInputs = screen.getAllByLabelText(/diterima/i);
    await userEvent.clear(qtyInputs[0]);
    await userEvent.type(qtyInputs[0], '40');

    await userEvent.click(screen.getByRole('button', { name: /terima barang/i }));
    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalled();
    });
  });
});
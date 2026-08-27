import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockList = vi.fn();
const mockPush = vi.fn();

vi.mock('@/features/outbound/api', () => ({
  listOutbound: (...a: unknown[]) => mockList(...a),
}));

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

import { OutboundList } from './OutboundList';
import type { StockMovement } from '@/shared/types/domain';

const movement: StockMovement = {
  id: 'MOV-001',
  movementNumber: 'OUT-2026-5001',
  originId: 'wh-pusat',
  destinationId: 'depo-rawat-inap',
  type: 'REPLENISHMENT',
  status: 'PICKING',
  items: [{ productId: '93000462', qty: 20 }],
  createdAt: '2026-08-01T08:00:00Z',
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('OutboundList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ data: [movement], totalCount: 1 });
  });

  it('renders movement rows after loading', async () => {
    render(<OutboundList />);
    await flush();
    await waitFor(() => expect(screen.getByText('OUT-2026-5001')).toBeInTheDocument());
    expect(screen.getByText('REPLENISHMENT')).toBeInTheDocument();
  });

  it('shows empty state when no movements', async () => {
    mockList.mockResolvedValue({ data: [], totalCount: 0 });
    render(<OutboundList />);
    await flush();
    await waitFor(() => expect(screen.getByText(/tidak ada outbound/i)).toBeInTheDocument());
  });
});
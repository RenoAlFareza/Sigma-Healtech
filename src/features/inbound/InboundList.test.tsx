import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { InboundReceipt } from '@/shared/types/domain';

const mockListInbound = vi.fn();
const mockPush = vi.fn();
let mockRole = 'ASSISTANT';

vi.mock('@/features/inbound/api', () => ({
  listInbound: (...args: unknown[]) => mockListInbound(...args),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ role: mockRole }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { InboundList } from './InboundList';

const receipt: InboundReceipt = {
  id: 'RCP-001',
  receiptNumber: 'IN-2026-3001',
  sourceType: 'SUPPLIER',
  status: 'CREATED',
  items: [{ productId: '93000462', qtyExpected: 100 }],
};

describe('InboundList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ASSISTANT';
    mockListInbound.mockResolvedValue({ data: [receipt], totalCount: 1 });
  });

  it('renders receipts from the existing inbound API', async () => {
    render(<InboundList />);

    await waitFor(() => expect(screen.getByText('IN-2026-3001')).toBeInTheDocument());
    expect(mockListInbound).toHaveBeenCalledWith({ status: undefined });
    expect(screen.getByRole('button', { name: /proses/i })).toBeInTheDocument();
  });

  it('shows completed receipts as a putaway queue', async () => {
    mockListInbound.mockResolvedValue({
      data: [{ ...receipt, status: 'COMPLETED' }],
      totalCount: 1,
    });
    render(<InboundList mode="putaway" />);

    await waitFor(() => expect(screen.getByText('IN-2026-3001')).toBeInTheDocument());
    expect(mockListInbound).toHaveBeenCalledWith({ status: 'COMPLETED' });
    expect(screen.getByRole('button', { name: /atur bin/i })).toBeInTheDocument();
  });

  it('removes processing actions for viewer roles', async () => {
    mockRole = 'VIEWER';
    render(<InboundList />);

    await waitFor(() => expect(screen.getByText('IN-2026-3001')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /proses/i })).not.toBeInTheDocument();
  });
});

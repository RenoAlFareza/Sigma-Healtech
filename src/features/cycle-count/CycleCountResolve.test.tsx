import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGet = vi.fn();
const mockResolve = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/cycle-count/api', () => ({
  getCycleCount: (...a: unknown[]) => mockGet(...a),
  submitCount: vi.fn(),
  resolveCycleCount: (...a: unknown[]) => mockResolve(...a),
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

import { CycleCountResolve } from './CycleCountResolve';

const count = {
  id: 'CC-1',
  countNumber: 'CC-2026-9001',
  locationId: 'wh-pusat',
  status: 'RESOLVING',
  items: [
    { productId: '93000462', lot: 'LOT-2026-001', bin: 'Z-A1', systemQty: 120, countedQty: 110, variance: -10 },
  ],
  createdAt: '2026-08-01T08:00:00Z',
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('CycleCountResolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(count);
    mockResolve.mockResolvedValue(count);
  });

  it('renders variance items and applies adjustment', async () => {
    render(<CycleCountResolve id="CC-1" />);
    await flush();
    await waitFor(() => expect(screen.getByText('-10')).toBeInTheDocument());

    // Select a reason code and resolve.
    const reasonSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(reasonSelect, 'TIDAK_SESUAI');

    await userEvent.click(screen.getByRole('button', { name: /terapkan adjustment/i }));

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalled();
    });
    const [cid, reasonCodes] = mockResolve.mock.calls[0] as [string, Record<string, string>];
    expect(cid).toBe('CC-1');
    expect(reasonCodes['93000462:LOT-2026-001']).toBe('TIDAK_SESUAI');
  });
});
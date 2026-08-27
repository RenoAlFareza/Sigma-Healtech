import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockGet = vi.fn();
const mockSubmit = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
const mockPush = vi.fn();

vi.mock('@/features/cycle-count/api', () => ({
  getCycleCount: (...a: unknown[]) => mockGet(...a),
  submitCount: (...a: unknown[]) => mockSubmit(...a),
  resolveCycleCount: vi.fn(),
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

import { CycleCountCount } from './CycleCountCount';

const count = {
  id: 'CC-1',
  countNumber: 'CC-2026-9001',
  locationId: 'wh-pusat',
  status: 'IN_PROGRESS',
  items: [
    { productId: '93000462', lot: 'LOT-2026-001', bin: 'Z-A1', systemQty: 120, countedQty: 115, variance: -5 },
  ],
  createdAt: '2026-08-01T08:00:00Z',
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('CycleCountCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(count);
    mockSubmit.mockResolvedValue(count);
  });

  it('renders items and submits counted quantities', async () => {
    render(<CycleCountCount id="CC-1" />);
    await flush();
    await waitFor(() => expect(screen.getByLabelText(/counted qty/i)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /simpan count/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
    const [cid, entries] = mockSubmit.mock.calls[0] as [string, unknown[]];
    expect(cid).toBe('CC-1');
    expect(Array.isArray(entries)).toBe(true);
    expect(mockPush).toHaveBeenCalledWith('/cycle-count/resolve?id=CC-1');
  });
});
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockGetReport = vi.fn();
const createObjectURL = vi.fn(() => 'blob:url');
const revokeObjectURL = vi.fn();

vi.mock('@/features/reports/api', () => ({
  getReport: (...a: unknown[]) => mockGetReport(...a),
}));

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { ReportsHub } from './ReportsHub';

const expiryData = {
  type: 'expiry',
  rows: [
    { productId: 'p1', kfaCode: '93000462', name: 'Paracetamol', lot: 'L1', expiry: '2026-12-01', qtyOnHand: 10, bin: 'Z', daysRemaining: 20, status: 'EXPIRING' },
  ],
};

async function flush() { await new Promise((r) => setTimeout(r, 0)); }

describe('ReportsHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReport.mockResolvedValue(expiryData);
  });

  it('renders the expiry tab by default and its data', async () => {
    render(<ReportsHub />);
    await flush();
    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());
    expect(mockGetReport).toHaveBeenCalledWith('expiry', expect.objectContaining({ locationId: 'wh-pusat' }));
  });

  it('switches tabs and fetches the matching report type', async () => {
    render(<ReportsHub />);
    await flush();
    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('tab', { name: /stockout/i }));
    await waitFor(() => {
      expect(mockGetReport).toHaveBeenCalledWith('stockout', expect.anything());
    });
  });

  it('triggers a CSV download on export', async () => {
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    HTMLAnchorElement.prototype.click = vi.fn();
    render(<ReportsHub />);
    await flush();
    await waitFor(() => expect(screen.getByText('Paracetamol')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(createObjectURL).toHaveBeenCalled();
  });
});
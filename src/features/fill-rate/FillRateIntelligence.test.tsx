import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FillRateData } from './api';

const mockGetFillRate = vi.fn();
const mockListLocations = vi.fn();
const mockSetLocation = vi.fn();

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    getFillRate: (...args: unknown[]) => mockGetFillRate(...args),
    listFillRateLocations: () => mockListLocations(),
  };
});
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ locationIds: ['wh-pusat'] }) }));
vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: mockSetLocation }),
}));

import { FillRateIntelligence } from './FillRateIntelligence';

const data: FillRateData = {
  locationId: 'wh-pusat',
  locationName: 'Gudang Farmasi Pusat',
  target: 90,
  metrics: {
    overallFillRate: 27.2727,
    requestedUnits: 110,
    approvedUnits: 80,
    issuedUnits: 30,
    completeOrderRate: 33.3333,
    completeOrders: 1,
    partialOrders: 0,
    totalOrders: 3,
    unfulfilledUnits: 80,
    urgentAtRisk: 1,
  },
  trend: [{ label: 'Min', requested: 110, approved: 80, issued: 30, fillRate: 27.2727 }],
  unitRanking: [{ unitId: 'depo-igd', unitName: 'Depo IGD', requested: 50, issued: 0, gap: 50, fillRate: 0 }],
  categoryPerformance: [{ category: 'Obat', requested: 110, issued: 30, gap: 80, fillRate: 27.2727 }],
  criticalGaps: [{ id: 'gap-1', title: 'REQ-001 · Paracetamol', description: 'Req 20 | Issued 0 | Gap 20 Tablet', actionLabel: 'Proses', href: '/requisitions/REQ-001', tone: 'warning' }],
  details: [{ id: 'row-1', requisitionId: 'REQ-001', requestNumber: 'REQ-2026-RQ-1001', unitId: 'depo-igd', unitName: 'Depo IGD', priority: 'RUTIN', productId: '93000462', productName: 'Paracetamol', kfaCode: '93000462', category: 'Obat', uom: 'Tablet', requested: 20, approved: 0, issued: 0, gap: 20, fillRate: 0, availableStock: 120, fulfillmentStatus: 'PENDING', requisitionStatus: 'SUBMITTED', createdAt: '2026-08-30T08:00:00.000Z', href: '/requisitions/REQ-001' }],
  statusCounts: { COMPLETE: 0, PARTIAL: 0, STOCKOUT: 0, PENDING: 1 },
  filterOptions: { units: [{ value: 'depo-igd', label: 'Depo IGD' }], categories: ['Obat'] },
};

describe('FillRateIntelligence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFillRate.mockResolvedValue(data);
    mockListLocations.mockResolvedValue([{ id: 'wh-pusat', name: 'Gudang Farmasi Pusat', code: 'GFP', type: 'WAREHOUSE' }]);
  });

  it('renders the complete bento hierarchy, charts, critical gaps, and ledger', async () => {
    render(<FillRateIntelligence />);

    expect(await screen.findByRole('heading', { name: 'Fill Rate Intelligence' })).toBeInTheDocument();
    expect(screen.getByText('Overall Fill Rate')).toBeInTheDocument();
    expect(screen.getByText('Complete Order Rate')).toBeInTheDocument();
    expect(screen.getByText('Unfulfilled Demand')).toBeInTheDocument();
    expect(screen.getByText('Urgent Request at Risk')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /mixed area chart/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /horizontal bar chart/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /grouped bar chart/i })).toBeInTheDocument();
    expect(screen.getByText('Critical Fulfillment Gaps')).toBeInTheDocument();
    expect(screen.getByText('REQ-2026-RQ-1001')).toBeInTheDocument();
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /buat requisition baru/i })).toHaveAttribute('href', '/requisitions/create');
  });

  it('refetches immediately when the fulfillment status filter changes', async () => {
    render(<FillRateIntelligence />);
    await screen.findByRole('heading', { name: 'Fill Rate Intelligence' });

    await userEvent.selectOptions(screen.getByLabelText('Status Pemenuhan'), 'PENDING');
    await waitFor(() => expect(mockGetFillRate).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'PENDING' })));
  });
});

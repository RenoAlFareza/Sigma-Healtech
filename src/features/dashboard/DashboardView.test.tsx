import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from './DashboardView';
import * as dashboardApi from './api';
import type { DashboardSummary, DashboardTrendData } from './api';

vi.mock('./api', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardTrend: vi.fn(),
}));
vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

const summary = {
  totalProducts: 150,
  activeInventoryQuantity: 458,
  activeLotCount: 7,
  activeBinCount: 5,
  stockedSkuCount: 5,
  locationId: 'wh-pusat',
  locationName: 'Gudang Farmasi Pusat',
  lowStockCount: 6,
  stockoutCount: 1,
  expiring30DaysCount: 3,
  openInboundQuantity: 100,
  openInboundReceiptCount: 1,
  inProgressShipmentCount: 1,
  inProgressShipmentQuantity: 20,
  inProgressRequisitionCount: 3,
  inProgressRequisitionQuantity: 110,
  pendingRequisitionsCount: 9,
  fillRatePercentage: 98.2,
};

const trend: DashboardTrendData = {
  monthlyFillRate: [{ month: 'Jan', qtyLeft: 400, fillRatePercent: 98 }],
  monthlyStockout: [{ month: 'Jan', stockoutCount: 1 }],
  categoryBreakdown: [{ category: 'Analgesik', quantity: 500, value: 1000 }],
  fastMovers: [{ name: 'Paracetamol', totalQty: 1000 }],
  weeklyFulfillment: [
    { day: 'SEN', requested: 30, approved: 28, issued: 25, received: 22 },
  ],
  operationalSchedule: {
    month: '2026-08',
    selectedDate: '2026-08-29',
    markedDates: ['2026-08-29'],
    agenda: {
      date: '2026-08-29',
      startTime: '10:30',
      endTime: '11:00',
      title: 'REQ-2026-URG-1002',
      subtitle: 'URGENT • 1 item',
      status: 'APPROVED',
      href: '/requisitions/REQ-002',
    },
  },
  recentTransactions: [
    { id: 'REQ-001', reference: 'REQ-2026-RQ-1001', label: 'Permintaan rutin', quantity: 30, status: 'SUBMITTED', occurredAt: '2026-08-29T09:30:00.000Z', href: '/requisitions/REQ-001' },
  ],
  recentActivities: [
    { id: 'activity-1', title: 'REQ-2026-RQ-1001 submitted', occurredAt: '2026-08-29T09:30:00.000Z', status: 'SUBMITTED', tone: 'info', href: '/requisitions/REQ-001' },
  ],
};

describe('DashboardView Component', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading state initially', () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<DashboardView />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders the complete Curelo dashboard composition with SIGMA content', async () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockResolvedValue(summary);
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockResolvedValue(trend);
    render(<DashboardView />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard Overview' })).toBeInTheDocument());
    expect(screen.getByText('Persediaan Aktif')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat detail Persediaan Aktif' })).toHaveAttribute('href', '/inventory?status=ACTIVE');
    expect(screen.getByText('Penerimaan Berjalan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat detail Penerimaan Berjalan' })).toHaveAttribute('href', '/inbound');
    expect(screen.getByText('1 dokumen')).toBeInTheDocument();
    expect(screen.getByText('Pengeluaran Berjalan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat detail Pengeluaran Berjalan' })).toHaveAttribute('href', '/outbound');
    expect(screen.getByText('20 unit')).toBeInTheDocument();
    expect(screen.getByText('Permintaan Diproses')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lihat detail Permintaan Diproses' })).toHaveAttribute('href', '/requisitions');
    expect(screen.getByRole('heading', { name: 'Inventory Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Expiration Summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pergerakan Stok Masuk (Stock In)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pergerakan Stok Keluar (Stock Out)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Permintaan Unit (Stock Out)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Penerimaan Supplier (Stock In)' })).toBeInTheDocument();
  });

  it('renders empty transaction and activity states', async () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockResolvedValue(summary);
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockResolvedValue({ ...trend, recentTransactions: [] });
    render(<DashboardView />);
    expect(await screen.findByText('Belum ada transaksi permintaan terbaru.')).toBeInTheDocument();
  });

  it('renders zero instead of NaN when KPI values are missing', async () => {
    const summaryWithMissingValues = {
      ...summary,
      openInboundQuantity: undefined,
      inProgressShipmentCount: undefined,
      inProgressRequisitionCount: undefined,
    } as unknown as DashboardSummary;
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockResolvedValue(summaryWithMissingValues);
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockResolvedValue(trend);
    render(<DashboardView />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dashboard Overview' })).toBeInTheDocument());
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3);
  });

  it('renders error state if API fails', async () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to load dashboard data'));
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to load dashboard data'));
    render(<DashboardView />);
    expect(await screen.findByText(/Gagal Memuat Dashboard/i)).toBeInTheDocument();
  });
});

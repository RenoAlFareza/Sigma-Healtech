import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from './DashboardView';
import * as dashboardApi from './api';

vi.mock('./api', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardTrend: vi.fn(),
}));

// Mock Recharts to avoid layout/ResizeObserver issues in Vitest JSDOM environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  CartesianGrid: () => <div />,
}));

describe('DashboardView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<DashboardView />);

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders KPI StatCards and Recharts charts when loaded', async () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      totalProducts: 150,
      lowStockCount: 6,
      stockoutCount: 1,
      expiring30DaysCount: 3,
      pendingRequisitionsCount: 9,
      fillRatePercentage: 98.2,
    });

    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      monthlyFillRate: [{ month: 'Jan', qtyLeft: 400, fillRatePercent: 98 }],
      monthlyStockout: [{ month: 'Jan', stockoutCount: 1 }],
      categoryBreakdown: [{ category: 'Analgesik', quantity: 500, value: 1000 }],
      fastMovers: [{ name: 'Paracetamol', totalQty: 1000 }],
    });

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('98.2%')).toBeInTheDocument();
    });

    expect(screen.getByText('Tren Pemenuhan Permintaan (Fill Rate)')).toBeInTheDocument();
    expect(screen.getByText('Distribusi Status Stok')).toBeInTheDocument();
    expect(screen.getByText('Top 5 Produk Fast-Moving')).toBeInTheDocument();
  });

  it('renders error state if API fails', async () => {
    (dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to load dashboard data'));
    (dashboardApi.getDashboardTrend as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Failed to load dashboard data'));

    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText(/Gagal Memuat Dashboard/i)).toBeInTheDocument();
    });
  });
});

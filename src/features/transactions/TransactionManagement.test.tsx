import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionOverviewData } from './api';

const mockGetOverview = vi.fn();
const mockListLocations = vi.fn();
const mockSetLocation = vi.fn();

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return { ...actual, getTransactionOverview: (...args: unknown[]) => mockGetOverview(...args), listTransactionLocations: () => mockListLocations() };
});
vi.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({ locationIds: ['wh-pusat'] }) }));
vi.mock('@/features/shell/ActiveLocationContext', () => ({ useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: mockSetLocation }) }));

import { TransactionManagement } from './TransactionManagement';

const data: TransactionOverviewData = {
  locationId: 'wh-pusat', locationName: 'Gudang Farmasi Pusat',
  metrics: { totalDocuments: 6, inboundDocuments: 1, inboundUnits: 0, inboundCompleted: 0, outboundDocuments: 4, outboundUnits: 30, outboundCompleted: 0, workInProgress: 6, actionRequired: 5, completionRate: 0 },
  distribution: [{ type: 'OUTBOUND', label: 'Pengiriman & Permintaan Unit', value: 4 }, { type: 'INBOUND', label: 'Penerimaan Supplier', value: 1 }, { type: 'TRANSFER', label: 'Transfer Antar Gudang', value: 1 }, { type: 'ADJUSTMENT', label: 'Adjustment Opname', value: 0 }],
  flowTrend: [{ label: 'Min', inbound: 0, outbound: 30 }],
  throughputTrend: [{ label: 'Min', created: 6, completed: 0, completionRate: 0 }],
  pipeline: [{ key: 'draft', label: 'Draft / Persiapan', value: 2, tone: 'muted' }, { key: 'processing', label: 'Receiving & Picking', value: 3, tone: 'warning' }, { key: 'transit', label: 'Dispatched / Transit', value: 1, tone: 'info' }, { key: 'completed', label: 'Completed Selesai', value: 0, tone: 'success' }],
  criticalActions: [{ id: 'receipt-1', title: 'IN-1 · Inbound Receipt', description: 'Paracetamol · 100 unit · CREATED', actionLabel: 'Selesaikan', href: '/inbound', tone: 'warning' }],
  recentTransactions: [{ id: 'receipt-1', reference: 'IN-1', type: 'INBOUND', typeLabel: 'Inbound Receipt', status: 'CREATED', statusGroup: 'IN_PROGRESS', origin: 'Supplier', destination: 'Gudang Farmasi Pusat', productSummary: 'Paracetamol', lotSummary: 'LOT-1', quantity: 100, postedQuantity: 0, createdAt: '2026-08-30T08:00:00.000Z', pic: 'Tim Inbound', href: '/inbound', actionRequired: true }],
  totalsByType: { INBOUND: 1, OUTBOUND: 4, TRANSFER: 1, ADJUSTMENT: 0 },
};

describe('TransactionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOverview.mockResolvedValue(data);
    mockListLocations.mockResolvedValue([{ id: 'wh-pusat', name: 'Gudang Farmasi Pusat', code: 'GFP', type: 'WAREHOUSE' }]);
  });

  it('renders the reference bento hierarchy and actual ledger', async () => {
    render(<TransactionManagement />);
    expect(await screen.findByRole('heading', { name: 'Transaction Management' })).toBeInTheDocument();
    expect(screen.getAllByText('Total Transaksi').length).toBeGreaterThan(0);
    expect(screen.getByText('Barang Masuk')).toBeInTheDocument();
    expect(screen.getByText('Barang Keluar')).toBeInTheDocument();
    expect(screen.getByText('Transaksi Diproses')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /grouped bar chart/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /donut chart/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /mixed chart throughput/i })).toBeInTheDocument();
    expect(screen.getByText('IN-1')).toBeInTheDocument();
  });

  it('refetches when the transaction type filter changes and exposes real create routes', async () => {
    render(<TransactionManagement />);
    await screen.findByRole('heading', { name: 'Transaction Management' });
    await userEvent.selectOptions(screen.getByLabelText('Jenis transaksi'), 'OUTBOUND');
    await waitFor(() => expect(mockGetOverview).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'OUTBOUND' })));
    await userEvent.click(screen.getByRole('button', { name: /tambah transaksi/i }));
    expect(screen.getByRole('menuitem', { name: /penerimaan inbound/i })).toHaveAttribute('href', '/inbound');
    expect(screen.getByRole('menuitem', { name: /transfer antar gudang/i })).toHaveAttribute('href', '/transfers/new');
  });
});

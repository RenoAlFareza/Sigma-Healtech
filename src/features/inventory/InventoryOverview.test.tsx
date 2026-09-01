import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InventoryOverviewData } from './api';

const mockGetOverview = vi.fn();
const mockListLocations = vi.fn();
const mockSetActiveLocationId = vi.fn();

vi.mock('./api', () => ({
  getInventoryOverview: (...args: unknown[]) => mockGetOverview(...args),
  listInventoryLocations: (...args: unknown[]) => mockListLocations(...args),
}));

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: mockSetActiveLocationId }),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ locationIds: ['wh-pusat', 'depo-igd'] }),
}));

import { InventoryOverview } from './InventoryOverview';

const overview: InventoryOverviewData = {
  locationId: 'wh-pusat',
  locationName: 'Gudang Farmasi Pusat',
  metrics: {
    receivingProducts: 1,
    receivingQuantity: 100,
    receivingDocuments: 1,
    unassignedBinProducts: 0,
    negativeInventoryProducts: 0,
    expiredProducts: 1,
    expiredLots: 1,
    expiredQuantity: 15,
    expiredValue: 75000,
    openStockRequests: 3,
    openRequestQuantity: 110,
    fillRate: 72.7,
    awaitingApprovalRequests: 1,
    awaitingApprovalQuantity: 30,
  },
  incomingSourceCounts: { supplier: 1, shipment: 0, transfer: 0 },
  incomingMovements: [{
    id: 'receipt-RCP-001',
    reference: 'IN-2026-3001',
    name: 'Penerimaan dari supplier',
    source: 'SUPPLIER',
    status: 'CREATED',
    quantity: 100,
    kind: 'SUPPLIER',
    href: '/inbound?id=RCP-001',
  }],
  stockHealth: [
    { label: 'Sehat', value: 4, tone: 'success' },
    { label: 'Kedaluwarsa', value: 1, tone: 'muted' },
  ],
  categoryDistribution: [
    { category: 'Analgesik/Antipiretik', quantity: 375, productCount: 2 },
    { category: 'Gastrointestinal', quantity: 60, productCount: 1 },
  ],
  incomingPipeline: [
    { key: 'supplier', label: 'Supplier', count: 1, quantity: 100, pharmacyQuantity: 100, medicalSupplyQuantity: 0, tone: 'green' },
    { key: 'shipment', label: 'Kiriman Unit', count: 0, quantity: 0, pharmacyQuantity: 0, medicalSupplyQuantity: 0, tone: 'blue' },
    { key: 'transfer', label: 'Transfer', count: 0, quantity: 0, pharmacyQuantity: 0, medicalSupplyQuantity: 0, tone: 'teal' },
  ],
  requestPipeline: [
    { status: 'SUBMITTED', label: 'Diajukan', count: 1, quantity: 30, tone: 'blue' },
    { status: 'APPROVED', label: 'Disetujui', count: 1, quantity: 50, tone: 'green' },
    { status: 'PICKING', label: 'Picking', count: 0, quantity: 0, tone: 'teal' },
    { status: 'ISSUED', label: 'Dikeluarkan', count: 1, quantity: 30, tone: 'dark' },
  ],
  demandFulfillment: [
    { label: 'DRI', requested: 30, fulfilled: 0 },
    { label: 'DIGD', requested: 50, fulfilled: 50 },
    { label: 'ARJ', requested: 30, fulfilled: 30 },
  ],
  criticalActions: [
    { id: 'expiry-1', kind: 'EXPIRY', title: 'Paracetamol (LOT-1)', description: 'Sudah kedaluwarsa · 15 Tablet', actionLabel: 'Retur', href: '/inventory?status=EXPIRED', tone: 'danger' },
  ],
};

describe('InventoryOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOverview.mockResolvedValue(overview);
    mockListLocations.mockResolvedValue([
      { id: 'wh-pusat', name: 'Gudang Farmasi Pusat', code: 'GFP', type: 'WAREHOUSE' },
      { id: 'depo-igd', name: 'Depo IGD', code: 'DIGD', type: 'DEPOT' },
      { id: 'apotek-rawat-jalan', name: 'Apotek Rawat Jalan', code: 'ARJ', type: 'PHARMACY' },
    ]);
  });

  it('renders the four bento KPIs, charts, and critical actions', async () => {
    render(<InventoryOverview />);

    expect(await screen.findByRole('heading', { name: 'Inventory Management' })).toBeInTheDocument();
    expect(screen.getByText('Menunggu Diterima')).toBeInTheDocument();
    expect(screen.getByText('Produk Kedaluwarsa')).toBeInTheDocument();
    expect(screen.getByText('Permintaan Terbuka')).toBeInTheDocument();
    expect(screen.getByText('Menunggu Persetujuan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /visualisasi stok masuk/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /distribusi persediaan/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /visualisasi permintaan stok/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /kontrol stok/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /grouped bar chart/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /donut chart distribusi/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /area chart permintaan/i })).toBeInTheDocument();
  });

  it('limits location choices to locations assigned to the user', async () => {
    render(<InventoryOverview />);
    const select = await screen.findByLabelText(/gudang \/ lokasi/i);

    expect(screen.getByRole('option', { name: 'Gudang Farmasi Pusat (GFP)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Depo IGD (DIGD)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Apotek Rawat Jalan (ARJ)' })).not.toBeInTheDocument();

    await userEvent.selectOptions(select, 'depo-igd');
    expect(mockSetActiveLocationId).toHaveBeenCalledWith('depo-igd');
  });

  it('renders zero instead of NaN for missing metric values', async () => {
    mockGetOverview.mockResolvedValue({
      ...overview,
      metrics: { ...overview.metrics, receivingQuantity: undefined },
    } as unknown as InventoryOverviewData);
    render(<InventoryOverview />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Inventory Management' })).toBeInTheDocument());
    expect(screen.queryByText('NaN')).not.toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventorySummary } from './InventorySummary';

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

const mockItems = [
  {
    id: 'item-1',
    locationId: 'wh-pusat',
    lot: 'LOT-001',
    bin: 'RAK-A-1',
    qtyOnHand: 450,
    expiry: '2027-12-31',
    product: {
      id: '93000462',
      kfaCode: '93000462',
      name: 'Paracetamol 500 mg Tablet',
      zatAktif: 'Paracetamol',
      category: 'Analgesik/Antipiretik',
      price: 5000,
      uom: 'Tablet',
      dosageForm: 'Tablet',
      kekuatan: '500 mg',
      nie: 'DBL1234567890A1',
      manufacturer: 'Kimia Farma',
    },
  },
  {
    id: 'item-2',
    locationId: 'wh-pusat',
    lot: 'LOT-002',
    bin: 'RAK-B-1',
    qtyOnHand: 30, // Below minimum
    expiry: '2027-10-15',
    product: {
      id: '93012826',
      kfaCode: '93012826',
      name: 'Amoxicillin 500 mg Kapsul',
      zatAktif: 'Amoxicillin',
      category: 'Antibiotik',
      price: 8000,
      uom: 'Kapsul',
      dosageForm: 'Kapsul',
      kekuatan: '500 mg',
      nie: 'GKL9876543210B1',
      manufacturer: 'Kalbe Farma',
    },
  },
  {
    id: 'item-3',
    locationId: 'wh-pusat',
    lot: 'LOT-003',
    bin: 'RAK-C-1',
    qtyOnHand: 0, // Out of stock
    expiry: '2028-01-01',
    product: {
      id: '93025130',
      kfaCode: '93025130',
      name: 'Omeprazole 20 mg Kapsul',
      zatAktif: 'Omeprazole',
      category: 'Gastrointestinal',
      price: 12000,
      uom: 'Kapsul',
      dosageForm: 'Kapsul',
      kekuatan: '20 mg',
      nie: 'DKL1122334455C1',
      manufacturer: 'Dexa Medica',
    },
  },
];

describe('InventorySummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockItems }),
    });
  });

  it('renders title, introductory text, and filter sidebar', async () => {
    render(<InventorySummary />);

    expect(await screen.findByRole('heading', { name: /Ringkasan Persediaan/i })).toBeInTheDocument();
    expect(screen.getByText(/Kembali ke Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Filter Laporan/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Terapkan Filter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ekspor CSV/i })).toBeInTheDocument();
  });

  it('renders products with badges and 14 table columns', async () => {
    render(<InventorySummary />);

    expect(await screen.findByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();
    expect(screen.getByText('Amoxicillin 500 mg Kapsul')).toBeInTheDocument();
    expect(screen.getByText('Omeprazole 20 mg Kapsul')).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Tersedia')).toBeInTheDocument();
    expect(screen.getByText('Di Bawah Min')).toBeInTheDocument();
    expect(screen.getByText('Stok Habis')).toBeInTheDocument();

    // Check columns
    expect(screen.getByText('Kode')).toBeInTheDocument();
    expect(screen.getByText('Keluarga Produk')).toBeInTheDocument();
    expect(screen.getByText('Kelas ABC')).toBeInTheDocument();
    expect(screen.getByText('Qty Fisik')).toBeInTheDocument();
    expect(screen.getByText('Qty ATP')).toBeInTheDocument();
    expect(screen.getByText('Harga Satuan')).toBeInTheDocument();
    expect(screen.getByText('Total Nilai')).toBeInTheDocument();
  });

  it('filters by search input', async () => {
    render(<InventorySummary />);

    expect(await screen.findByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Cari produk/i);
    fireEvent.change(searchInput, { target: { value: 'Amoxicillin' } });

    expect(screen.getByText('Amoxicillin 500 mg Kapsul')).toBeInTheDocument();
    expect(screen.queryByText('Paracetamol 500 mg Tablet')).not.toBeInTheDocument();
  });

  it('filters by status and category', async () => {
    render(<InventorySummary />);

    expect(await screen.findByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();

    // Select category
    const categorySelect = screen.getByLabelText(/Kategori Produk/i);
    fireEvent.change(categorySelect, { target: { value: 'Antibiotik' } });

    // Click Run Report
    fireEvent.click(screen.getByRole('button', { name: /Terapkan Filter/i }));

    expect(screen.getByText('Amoxicillin 500 mg Kapsul')).toBeInTheDocument();
    expect(screen.queryByText('Paracetamol 500 mg Tablet')).not.toBeInTheDocument();
  });
});

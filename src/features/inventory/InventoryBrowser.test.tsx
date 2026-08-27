import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { InventoryItem } from '@/shared/types/domain';

const mockList = vi.fn();
const mockPush = vi.fn();

vi.mock('@/features/inventory/api', () => ({
  listInventory: (...args: unknown[]) => mockList(...args),
}));

vi.mock('@/features/shell/ActiveLocationContext', () => ({
  useActiveLocation: () => ({ activeLocationId: 'wh-pusat', setActiveLocationId: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

import { InventoryBrowser } from './InventoryBrowser';

const products = {
  paracetamol: {
    id: '93000462',
    kfaCode: '93000462',
    name: 'Paracetamol 500 mg Tablet',
    zatAktif: 'Paracetamol',
    kekuatan: '500 mg',
    dosageForm: 'Tablet',
    nie: 'GBL1',
    manufacturer: 'AFIFARMA',
    price: 5000,
    uom: 'Tablet',
    category: 'Analgesik/Antipiretik',
  },
};

const items: InventoryItem[] = [
  {
    id: 'i1',
    product: products.paracetamol,
    locationId: 'wh-pusat',
    lot: 'LOT-2026-001',
    expiry: '2027-06-01',
    qtyOnHand: 120,
    bin: 'Z-A1',
    status: 'IN_STOCK',
  },
  {
    id: 'i2',
    product: { ...products.paracetamol, id: '93012826', kfaCode: '93012826', name: 'Amoxicillin 500 mg' },
    locationId: 'wh-pusat',
    lot: 'LOT-2026-010',
    expiry: '2027-05-01',
    qtyOnHand: 8,
    bin: 'Z-B2',
    status: 'LOW_STOCK',
  },
];

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('InventoryBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ data: items, totalCount: 2 });
  });

  it('renders the filter bar and fetches inventory for the active location', async () => {
    render(<InventoryBrowser />);
    await flushPromises();

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ locationId: 'wh-pusat' })
    );
    expect(screen.getByLabelText(/kategori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('renders inventory rows in the table after loading', async () => {
    render(<InventoryBrowser />);
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('LOT-2026-001')).toBeInTheDocument();
    });
    expect(screen.getByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();
    expect(screen.getByText('Z-A1')).toBeInTheDocument();
  });

  it('applies a status filter and refetches', async () => {
    render(<InventoryBrowser />);
    await flushPromises();

    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'LOW_STOCK');
    await flushPromises();

    expect(mockList).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'LOW_STOCK' })
    );
  });

  it('shows an empty state when there are no items', async () => {
    mockList.mockResolvedValue({ data: [], totalCount: 0 });
    render(<InventoryBrowser />);
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText(/tidak ada item/i)).toBeInTheDocument();
    });
  });

  it('navigates to the stock card when a row is clicked', async () => {
    render(<InventoryBrowser />);
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('LOT-2026-001')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('LOT-2026-001'));
    expect(mockPush).toHaveBeenCalledWith('/inventory/93000462');
  });
});
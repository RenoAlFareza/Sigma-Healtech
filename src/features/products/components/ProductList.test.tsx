import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Product } from '@/shared/types/domain';

const routerPush = vi.fn();
let mockRole = 'ADMIN';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ role: mockRole }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/products',
}));

/**
 * Wait for the async list effect to settle, driving the mocked promise
 * to resolution before asserting.
 */
async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const mockList = vi.fn();
const mockCategories = vi.fn();

vi.mock('@/features/products/api', () => ({
  listProducts: (...args: unknown[]) => mockList(...args),
  getProduct: vi.fn(),
  getCategories: (...args: unknown[]) => mockCategories(...args),
}));

import { ProductList } from './ProductList';

const products: Product[] = [
  {
    id: '93000462',
    kfaCode: '93000462',
    name: 'Paracetamol 500 mg Tablet',
    zatAktif: 'Paracetamol',
    kekuatan: '500 mg',
    dosageForm: 'Tablet',
    nie: 'GBL2101710510A1',
    manufacturer: 'AFIFARMA',
    price: 5000,
    uom: 'Tablet',
    category: 'Analgesik/Antipiretik',
  },
];

function renderList() {
  return render(<ProductList />);
}

describe('ProductList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRole = 'ADMIN';
    mockList.mockResolvedValue({ data: products, totalCount: 1 });
    mockCategories.mockResolvedValue(['Analgesik/Antipiretik', 'Antibiotik']);
  });

  it('renders the search input and category filter', async () => {
    renderList();
    await flushPromises();

    expect(screen.getByLabelText(/search products/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('renders product rows in the table after loading', async () => {
    renderList();
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('93000462')).toBeInTheDocument();
    });
    expect(screen.getByText('Paracetamol 500 mg Tablet')).toBeInTheDocument();
    expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    expect(screen.getByText(/Rp\s*5\.000/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no products', async () => {
    mockList.mockResolvedValue({ data: [], totalCount: 0 });
    renderList();
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText(/no products/i)).toBeInTheDocument();
    });
  });

  it('re-fetches when the search keyword is submitted', async () => {
    renderList();
    await flushPromises();

    const input = screen.getByLabelText(/search products/i);
    await userEvent.type(input, 'amox{enter}');
    await flushPromises();

    expect(mockList).toHaveBeenLastCalledWith({
      keyword: 'amox',
      category: 'ALL',
      page: 1,
      size: 20,
    });
  });

  it('hides product mutation actions for non-admin roles', async () => {
    mockRole = 'VIEWER';
    renderList();
    await flushPromises();

    expect(screen.queryByRole('button', { name: /new product/i })).not.toBeInTheDocument();
  });
});

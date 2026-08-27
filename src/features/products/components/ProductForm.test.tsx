import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/products/new',
}));

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockGetProduct = vi.fn();

vi.mock('@/features/products/api', () => ({
  createProduct: (...args: unknown[]) => mockCreate(...args),
  updateProduct: (...args: unknown[]) => mockUpdate(...args),
  getProduct: (...args: unknown[]) => mockGetProduct(...args),
  getCategories: () => Promise.resolve(['Analgesik/Antipiretik', 'Antibiotik']),
}));

import { ProductForm } from './ProductForm';

function renderForm() {
  return render(<ProductForm />);
}

const existingProduct = {
  id: '93000462',
  kfaCode: '93000462',
  name: 'Paracetamol 500 mg Table',
  zatAktif: 'Paracetamol',
  kekuatan: '500 mg',
  dosageForm: 'Tablet',
  nie: 'GBL2101710510A1',
  manufacturer: 'AFIFARMA',
  price: 5000,
  uom: 'Tablet',
  category: 'Analgesik/Antipiretik',
};

describe('ProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
    mockGetProduct.mockResolvedValue(existingProduct);
  });

  it('renders all required form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/nama produk/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kfa code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zat aktif/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/harga/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kategori/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /simpan/i })).toBeInTheDocument();
  });

  it('shows a validation error on submit with an empty required field', async () => {
    renderForm();

    // Dispatch submit directly on the form to bypass native constraint
    // validation (the empty required inputs would otherwise block onSubmit).
    fireEvent.submit(document.getElementById('product-form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText('Nama produk wajib diisi')).toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('submits created product payload and shows a success toast', async () => {
    renderForm();

    await userEvent.type(screen.getByLabelText(/nama produk/i), 'Amoxicillin 500 mg');
    await userEvent.type(screen.getByLabelText(/kfa code/i), '93000400');
    await userEvent.selectOptions(
      screen.getByLabelText(/kategori/i),
      'Analgesik/Antipiretik'
    );
    await userEvent.type(screen.getByLabelText(/zat aktif/i), 'Amoxicillin');

    await userEvent.click(screen.getByRole('button', { name: /simpan/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    const payload = mockCreate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.name).toBe('Amoxicillin 500 mg');
    expect(payload.kfaCode).toBe('93000400');

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it('pre-populates fields when editing an existing product', async () => {
    render(<ProductForm product={existingProduct} />);

    expect(screen.getByLabelText(/nama produk/i)).toHaveValue('Paracetamol 500 mg Table');
    expect(screen.getByLabelText(/kfa code/i)).toHaveValue('93000462');
  });

  it('fetches the product by id and pre-fills the form when editing by id', async () => {
    render(<ProductForm mode="edit" productId="93000462" />);

    await waitFor(() => {
      expect(mockGetProduct).toHaveBeenCalledWith('93000462');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/nama produk/i)).toHaveValue('Paracetamol 500 mg Table');
      expect(screen.getByLabelText(/kfa code/i)).toHaveValue('93000462');
    });
  });

  it('submits an update via updateProduct when editing', async () => {
    render(<ProductForm product={existingProduct} mode="edit" />);

    await userEvent.type(screen.getByLabelText(/nama produk/i), ' Updated');

    await userEvent.click(screen.getByRole('button', { name: /simpan/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });

    const [id, payload] = mockUpdate.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe('93000462');
    expect(payload.name).toContain('Updated');

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
    });
  });
});
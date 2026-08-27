import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '@/api';
import type { Product } from '@/shared/types/domain';

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return { ...actual, apiFetch: vi.fn() };
});

import { listProducts, getProduct, createProduct, updateProduct, getCategories } from './api';

const mockApiFetch = vi.mocked(apiFetch);

const product: Product = {
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
};

describe('products api', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it('listProducts calls apiFetch with serialized query params', async () => {
    mockApiFetch.mockResolvedValue({ data: [product], totalCount: 1 });

    const res = await listProducts({ keyword: 'para', category: 'Analgesik', page: 2, size: 10 });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/products?keyword=para&category=Analgesik&page=2&size=10'
    );
    expect(res.data).toEqual([product]);
    expect(res.totalCount).toBe(1);
  });

  it('listProducts omits empty and ALL-category params', async () => {
    mockApiFetch.mockResolvedValue({ data: [], totalCount: 0 });

    await listProducts({ category: 'ALL' });

    expect(mockApiFetch).toHaveBeenCalledWith('/products');
  });

  it('getProduct calls apiFetch with the product id and no fallback', async () => {
    mockApiFetch.mockResolvedValue(product);

    const res = await getProduct('93000462');

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith('/products/93000462');
    expect(res).toEqual(product);
  });

  it('createProduct POSTs to /products with the payload', async () => {
    const created = { ...product, id: '93000999' };
    mockApiFetch.mockResolvedValue(created);

    const payload = { name: 'New Drug', kfaCode: '93000999', zatAktif: 'X', category: 'Antibiotik' };
    const res = await createProduct(payload);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith('/products', {
      method: 'POST',
      body: payload,
    });
    expect(res).toEqual(created);
  });

  it('updateProduct PUTs to /products/:id with the payload', async () => {
    const updated = { ...product, name: 'Paracetamol 500 mg Updated' };
    mockApiFetch.mockResolvedValue(updated);

    const payload = { name: 'Paracetamol 500 mg Updated' };
    const res = await updateProduct('93000462', payload);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(mockApiFetch).toHaveBeenCalledWith('/products/93000462', {
      method: 'PUT',
      body: payload,
    });
    expect(res).toEqual(updated);
  });

  it('getCategories derives a sorted, de-duplicated list from the product data', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [
        product,
        { ...product, id: '93000999', category: 'Antibiotik' },
        { ...product, id: '93001000', category: 'Analgesik/Antipiretik' },
      ],
      totalCount: 3,
    });

    const cats = await getCategories();

    expect(mockApiFetch).toHaveBeenCalledWith('/products?size=100000');
    expect(cats).toEqual(['Analgesik/Antipiretik', 'Antibiotik']);
    expect(new Set(cats).size).toBe(cats.length);
    expect(cats).toEqual([...cats].sort((a, b) => a.localeCompare(b)));
  });

  it('getCategories omits blank/undefined categories', async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [
        { ...product, category: '' },
        { ...product, id: '93000999', category: '   ' },
        { ...product, id: '93001000', category: 'Vitamin' },
      ],
      totalCount: 3,
    });

    const cats = await getCategories();

    expect(cats).toEqual(['Vitamin']);
  });
});
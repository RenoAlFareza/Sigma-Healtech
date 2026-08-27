'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackagePlus, Search } from 'lucide-react';
import { DataTable, Input, Select, StatusBadge, Card, ErrorState, Button } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import type { Product } from '@/shared/types/domain';
import { listProducts, getCategories } from '../api';

const PAGE_SIZE = 20;

interface LoadedState {
  data: Product[];
  totalCount: number;
}

export function ProductList() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<LoadedState>({ data: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  const load = useCallback(async (overrides?: { keyword?: string; category?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listProducts({
        keyword: overrides?.keyword !== undefined ? overrides.keyword : keyword,
        category: overrides?.category !== undefined ? overrides.category : category,
        page: overrides?.page !== undefined ? overrides.page : page,
        size: PAGE_SIZE,
      });
      setData({ data: res.data, totalCount: res.totalCount });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setData({ data: [], totalCount: 0 });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, category, page]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load({ keyword, category, page: 1 });
  };

  const handleCategory = (value: string) => {
    setCategory(value);
    setPage(1);
    void load({ keyword, category: value, page: 1 });
  };

  const handlePage = (next: number) => {
    setPage(next);
    void load({ keyword, category, page: next });
  };

  const columns: DataTableColumn<Product>[] = [
    { id: 'kfa', header: 'KFA Code', accessorKey: 'kfaCode', isMono: true, width: '110px' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'zatAktif', header: 'Zat Aktif', accessorKey: 'zatAktif' },
    { id: 'dosageForm', header: 'Dosage Form', accessorKey: 'dosageForm' },
    { id: 'category', header: 'Category', accessorKey: 'category' },
    { id: 'manufacturer', header: 'Manufacturer', accessorKey: 'manufacturer' },
    {
      id: 'price',
      header: 'Price',
      align: 'right',
      cell: (p) => formatCurrency(p.price),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => <StatusBadge status="ACTIVE" size="sm" />,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card
        padding="md"
        title="Products Catalog"
        subtitle={`${data.totalCount.toLocaleString()} KFA products`}
        headerAction={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PackagePlus className="w-4 h-4" />}
            onClick={() => router.push('/products/new')}
          >
            New Product
          </Button>
        }
      >
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-4"
        >
          <div className="flex-1">
            <Input
              id="product-search"
              label="Search products"
              placeholder="Search by name, KFA code, or zat aktif…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              leftIcon={<Search className="w-4 h-4" aria-hidden="true" />}
            />
          </div>
          <div className="sm:w-64">
            <Select
              id="category-filter"
              label="Category"
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Kategori' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <Button type="submit" variant="secondary" leftIcon={<Search className="w-4 h-4" />}>
            Search
          </Button>
        </form>

        {error ? (
          <ErrorState message={error} onRetry={() => void load()} title="Failed to load products" />
        ) : (
          <DataTable
            data={data.data}
            columns={columns}
            keyExtractor={(p) => p.id}
            loading={loading}
            emptyText="No products found"
            emptyAction={
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Clear filters
              </Button>
            }
            onRowClick={(p) => router.push(`/products/${p.id}`)}
            pagination={{
              currentPage: page,
              totalPages,
              onPageChange: handlePage,
              totalItems: data.totalCount,
              pageSize: PAGE_SIZE,
            }}
          />
        )}
      </Card>
    </div>
  );
}

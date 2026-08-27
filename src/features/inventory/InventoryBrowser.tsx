'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Boxes } from 'lucide-react';
import { Card, DataTable, StatusBadge, Select, Input, Pagination, Skeleton, EmptyState, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { listInventory } from './api';
import type { ListInventoryParams } from './api';
import type { InventoryItem } from '@/shared/types/domain';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'STOCKOUT', label: 'Stockout' },
  { value: 'EXPIRING', label: 'Expiring' },
  { value: 'EXPIRED', label: 'Expired' },
];

export function InventoryBrowser() {
  const router = useRouter();
  const { activeLocationId } = useActiveLocation();

  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeLocationId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    setError(null);
    const params: ListInventoryParams = {
      locationId: activeLocationId,
      keyword: submittedKeyword || undefined,
      category: category === 'ALL' ? undefined : category,
      status: status === 'ALL' ? undefined : status,
      page,
      size: PAGE_SIZE,
    };
    try {
      const res = await listInventory(params);
      setData(res.data);
      setTotalCount(res.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat inventori');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [activeLocationId, submittedKeyword, category, status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(
    () => ['Analgesik/Antipiretik', 'Antibiotik', 'Antasida', 'Antidiare', 'Antiemetik', 'Antihipertensi', 'Antinflamasi', 'Antiseptik', 'Antivirus', 'Bronkodilator', 'Dermatologis', 'Diuretik', 'Ekspektoran', 'Gastrointestinal', 'Hematologi', 'Hormon', 'Imunosupresan', 'Kardiovaskular', 'Kortikosteroid', 'Kulit', 'Lainnya', 'Mineral', 'Mukolitik', 'Nutrisi', 'Obat Bebas', 'Oftalmik', 'Psikotropika', 'Respirasi', 'Saluran Cerna', 'Saluran Napas', 'Steroid', 'Suplementasi', 'Vitamin', 'Vitamin/Mineral'],
    []
  );

  const columns: DataTableColumn<InventoryItem>[] = useMemo(
    () => [
      { id: 'kfaCode', header: 'SKU', cell: (it) => it.product.kfaCode, isMono: true, width: '110px' },
      { id: 'name', header: 'Nama Produk', cell: (it) => it.product.name },
      { id: 'category', header: 'Kategori', cell: (it) => it.product.category },
      { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
      { id: 'expiry', header: 'Kadaluarsa', cell: (it) => formatDate(it.expiry, 'iso'), isMono: true },
      { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
      {
        id: 'qtyOnHand',
        header: 'QoH',
        align: 'right',
        cell: (it) => formatQuantity(it.qtyOnHand),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (it) => <StatusBadge status={it.status} size="sm" />,
      },
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSubmitKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedKeyword(keyword);
  };

  if (!activeLocationId) {
    return (
      <EmptyState
        title="Tidak ada lokasi aktif"
        description="Pilih lokasi aktif untuk melihat inventori."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Inventori"
        subtitle="Stok per item/lokasi/bin"
        padding="md"
      >
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <form onSubmit={handleSubmitKeyword} className="flex-1 md:max-w-xs">
            <Input
              id="keyword"
              label="Cari Produk"
              placeholder="Nama, SKU, atau lot…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </form>
          <div className="w-full md:w-56">
            <Select
              id="category"
              label="Kategori"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={[{ value: 'ALL', label: 'Semua Kategori' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              id="status"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Inventori" />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(it) => it.id}
          loading={loading}
          emptyText="Tidak ada item inventori"
          emptyIcon={<Boxes className="w-6 h-6" />}
          onRowClick={(it) => router.push(`/inventory/${it.product.id}`)}
          pagination={
            totalPages > 1
              ? {
                  currentPage: page,
                  totalPages,
                  onPageChange: setPage,
                  totalItems: totalCount,
                  pageSize: PAGE_SIZE,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
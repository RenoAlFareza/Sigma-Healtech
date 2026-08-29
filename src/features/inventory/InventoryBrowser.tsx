'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Boxes, PackageSearch } from 'lucide-react';
import { Card, DataTable, StatusBadge, Select, Input, EmptyState, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency, formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { listInventory, listInventoryLocations } from './api';
import type { ListInventoryParams } from './api';
import type { InventoryItem, Location } from '@/shared/types/domain';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Persediaan Aktif' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'STOCKOUT', label: 'Stockout' },
  { value: 'EXPIRING', label: 'Expiring' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'UNASSIGNED_BIN', label: 'Belum Memiliki Bin' },
  { value: 'NEGATIVE', label: 'Persediaan Negatif' },
];

export function InventoryBrowser({
  initialStatus = 'ALL',
  showStockCardGuide = false,
}: {
  initialStatus?: string;
  showStockCardGuide?: boolean;
}) {
  const router = useRouter();
  const { activeLocationId, setActiveLocationId } = useActiveLocation();
  const { locationIds } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

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
    const requestId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(requestId);
  }, [fetchData]);

  useEffect(() => {
    let active = true;
    listInventoryLocations()
      .then((items) => {
        if (active) setLocations(items);
      })
      .catch(() => {
        if (active) setLocations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableLocations = useMemo(
    () => locationIds.length > 0 ? locations.filter((location) => locationIds.includes(location.id)) : locations,
    [locationIds, locations]
  );
  const selectedLocation = availableLocations.find((location) => location.id === activeLocationId);

  const categories = useMemo(
    () => ['Analgesik/Antipiretik', 'Antibiotik', 'Antasida', 'Antidiare', 'Antiemetik', 'Antihipertensi', 'Antinflamasi', 'Antiseptik', 'Antivirus', 'Bronkodilator', 'Dermatologis', 'Diuretik', 'Ekspektoran', 'Gastrointestinal', 'Hematologi', 'Hormon', 'Imunosupresan', 'Kardiovaskular', 'Kortikosteroid', 'Kulit', 'Lainnya', 'Mineral', 'Mukolitik', 'Nutrisi', 'Obat Bebas', 'Oftalmik', 'Psikotropika', 'Respirasi', 'Saluran Cerna', 'Saluran Napas', 'Steroid', 'Suplementasi', 'Vitamin', 'Vitamin/Mineral'],
    []
  );

  const columns: DataTableColumn<InventoryItem>[] = useMemo(
    () => [
      {
        id: 'status',
        header: 'Status',
        cell: (it) => <StatusBadge status={it.status} size="sm" />,
      },
      { id: 'kfaCode', header: 'Kode KFA', cell: (it) => it.product.kfaCode, isMono: true, width: '110px' },
      { id: 'name', header: 'Nama Produk', cell: (it) => it.product.name },
      { id: 'bin', header: 'Bin / Rak', accessorKey: 'bin', isMono: true },
      { id: 'lot', header: 'Nomor Lot', accessorKey: 'lot', isMono: true },
      { id: 'expiry', header: 'Kedaluwarsa', cell: (it) => formatDate(it.expiry, 'iso'), isMono: true },
      {
        id: 'qtyOnHand',
        header: 'Qty On Hand',
        align: 'right',
        cell: (it) => formatQuantity(it.qtyOnHand),
      },
      {
        id: 'qtyAvailable',
        header: 'Qty Available',
        align: 'right',
        cell: (it) => formatQuantity(Math.max(0, it.qtyOnHand - (it.qtyReserved ?? 0))),
      },
      { id: 'uom', header: 'UOM', cell: (it) => it.product.uom || '—' },
      { id: 'unitCost', header: 'Harga Satuan', align: 'right', cell: (it) => formatCurrency(it.product.price) },
      { id: 'totalValue', header: 'Total Nilai', align: 'right', cell: (it) => formatCurrency(it.qtyOnHand * it.product.price) },
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSubmitKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedKeyword(keyword.trim());
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (!value.trim() && submittedKeyword) {
      setSubmittedKeyword('');
      setPage(1);
    }
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
      {showStockCardGuide && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#cfe1f6] bg-[#edf6ff] px-4 py-3 text-[#285d93]">
          <PackageSearch className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          <div>
            <p className="text-xs font-bold">Buka Kartu Stok & Lot</p>
            <p className="mt-1 text-[10px] leading-5 text-[#5d7895]">
              Pilih salah satu produk pada tabel untuk melihat lot, tanggal kedaluwarsa, posisi bin, dan audit ledger stok.
            </p>
          </div>
        </div>
      )}
      <Card
        title="Rincian Persediaan per Lot dan Bin"
        subtitle={`Informasi quantity, kedaluwarsa, posisi bin/rak, dan nilai stok di ${selectedLocation?.name ?? 'lokasi aktif'}`}
        padding="md"
      >
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="w-full md:w-64">
            <Select
              id="inventory-location"
              label="Gudang / Lokasi"
              value={activeLocationId}
              onChange={(e) => {
                setActiveLocationId(e.target.value);
                setPage(1);
              }}
              options={availableLocations.map((location) => ({
                value: location.id,
                label: `${location.name} (${location.code})`,
              }))}
            />
          </div>
          <form onSubmit={handleSubmitKeyword} className="flex-1 md:max-w-xs">
            <Input
              id="keyword"
              label="Cari Produk"
              placeholder="Nama, SKU, atau lot…"
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
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

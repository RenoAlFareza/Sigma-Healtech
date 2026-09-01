'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  PackageSearch,
  Play,
  Search,
} from 'lucide-react';
import { EmptyState, Skeleton, StatusBadge } from '@/shared/ui';
import { formatCurrency, formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { listInventory, listInventoryLocations } from './api';
import type { ListInventoryParams } from './api';
import type { InventoryItem, Location } from '@/shared/types/domain';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'ACTIVE', label: 'Persediaan Aktif' },
  { value: 'IN_STOCK', label: 'In Stock (Tersedia)' },
  { value: 'LOW_STOCK', label: 'Low Stock (Menipis)' },
  { value: 'STOCKOUT', label: 'Stockout (Habis)' },
  { value: 'EXPIRING', label: 'Mendekati ED' },
  { value: 'EXPIRED', label: 'Expired (Kedaluwarsa)' },
  { value: 'UNASSIGNED_BIN', label: 'Belum Ada Bin' },
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
    () => (locationIds.length > 0 ? locations.filter((location) => locationIds.includes(location.id)) : locations),
    [locationIds, locations]
  );
  const selectedLocation = availableLocations.find((location) => location.id === activeLocationId);

  const categories = useMemo(
    () => [
      'Analgesik/Antipiretik',
      'Antibiotik',
      'Antasida',
      'Antidiare',
      'Antiemetik',
      'Antihipertensi',
      'Antinflamasi',
      'Antiseptik',
      'Antivirus',
      'Bronkodilator',
      'Dermatologis',
      'Diuretik',
      'Ekspektoran',
      'Gastrointestinal',
      'Hematologi',
      'Hormon',
      'Imunosupresan',
      'Kardiovaskular',
      'Kortikosteroid',
      'Kulit',
      'Lainnya',
      'Mineral',
      'Mukolitik',
      'Nutrisi',
      'Obat Bebas',
      'Oftalmik',
      'Psikotropika',
      'Respirasi',
      'Saluran Cerna',
      'Saluran Napas',
      'Steroid',
      'Suplementasi',
      'Vitamin',
      'Vitamin/Mineral',
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleResetFilter = () => {
    setCategory('ALL');
    setStatus('ALL');
    setKeyword('');
    setSubmittedKeyword('');
    setPage(1);
  };

  const handleDownloadCsv = () => {
    if (!data.length) return;
    const headers = ['Kode KFA', 'Nama Produk', 'Bin / Rak', 'Nomor Lot', 'Kedaluwarsa', 'Qty On Hand', 'Qty Available', 'UOM', 'Harga Satuan (IDR)', 'Total Nilai (IDR)', 'Status'];
    const rows = data.map((r) => [
      `"${r.product.kfaCode}"`,
      `"${r.product.name.replace(/"/g, '""')}"`,
      `"${r.bin}"`,
      `"${r.lot}"`,
      `"${r.expiry}"`,
      r.qtyOnHand,
      Math.max(0, r.qtyOnHand - (r.qtyReserved ?? 0)),
      `"${r.product.uom || 'Tablet'}"`,
      r.product.price || 5000,
      r.qtyOnHand * (r.product.price || 5000),
      `"${r.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rincian_Persediaan_${activeLocationId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="space-y-3">
        <div>
          <Link
            href="/inventory/overview"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Ringkasan Persediaan
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1b2a24]">Rincian Persediaan (Inventory Details)</h1>
              <p className="mt-1.5 max-w-4xl text-xs leading-relaxed text-[#52665d]">
                Informasi persediaan terperinci pada level nomor lot/batch pabrikan, tanggal kedaluwarsa (ED), dan posisi bin/rak
                penyimpanan di {selectedLocation?.name ?? 'fasilitas aktif'}.
              </p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-[#2d6a4f] bg-[#e8f5e9] px-3.5 py-2 rounded-xl border border-[#c8e6c9]">
              {selectedLocation?.name ?? activeLocationId}
            </div>
          </div>
        </div>
      </div>

      {showStockCardGuide && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#c8e6c9] bg-[#f1f8f4] px-4 py-3 text-[#2d6a4f]">
          <PackageSearch className="mt-0.5 h-5 w-5 shrink-0 text-[#2d6a4f]" strokeWidth={1.8} aria-hidden="true" />
          <div>
            <p className="text-xs font-bold">Buka Kartu Stok & Lot</p>
            <p className="mt-1 text-[11px] leading-5 text-[#40534c]">
              Klik pada baris produk di bawah untuk membuka kartu stok elektronik dan audit buku besar ledger transaksi.
            </p>
          </div>
        </div>
      )}

      {/* 2. Main Grid: Filter Sidebar (Left) + Table View (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Filter Sidebar */}
        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1b2a24]">
                <Filter className="h-4 w-4 text-[#2d6a4f]" />
                <span>Filter Rincian</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-[#6b7c74] transition hover:text-[#1b2a24]"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Location Select */}
              <div className="space-y-1.5">
                <label htmlFor="inventory-location" className="block text-xs font-semibold text-[#31483c]">
                  Gudang / Lokasi
                </label>
                <div className="relative">
                  <select
                    id="inventory-location"
                    value={activeLocationId}
                    onChange={(e) => {
                      setActiveLocationId(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-xl border border-[#d8e2dc] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7c74]" />
                </div>
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <label htmlFor="category" className="block text-xs font-semibold text-[#31483c]">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-xl border border-[#d8e2dc] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="ALL">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7c74]" />
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label htmlFor="status" className="block text-xs font-semibold text-[#31483c]">
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full appearance-none rounded-xl border border-[#d8e2dc] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7c74]" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d6a4f] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1b4332]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Terapkan Filter
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={data.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2d6a4f] bg-white py-2 text-xs font-bold text-[#2d6a4f] shadow-sm transition hover:bg-[#e8f5e9] disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Ekspor CSV
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Table Content */}
        <main className="space-y-4 lg:col-span-9">
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            {/* Top Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#edf1ee] pb-4">
              <div>
                <h2 className="text-sm font-bold text-[#2d6a4f]">
                  Rincian Persediaan — Menampilkan {totalCount} entri lot
                </h2>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSubmitKeyword} className="relative w-full sm:w-72">
                <label htmlFor="keyword" className="sr-only">
                  Cari Produk
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca8a2]" />
                <input
                  id="keyword"
                  type="text"
                  placeholder="Cari produk / SKU / Lot…"
                  value={keyword}
                  onChange={(e) => handleKeywordChange(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] pl-9 pr-3 text-xs text-[#1b2a24] outline-none transition placeholder:text-[#9ca8a2] focus:border-[#2d6a4f] focus:bg-white"
                />
              </form>
            </div>

            {/* Table Area */}
            {loading ? (
              <div className="space-y-3 py-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-xs text-red-600">{error}</div>
            ) : data.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="Tidak ada item inventori"
                  description="Tidak ditemukan lot yang sesuai dengan filter atau kata kunci pencarian."
                  icon={<Boxes className="w-8 h-8 text-[#9ca8a2]" />}
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Kode KFA</th>
                      <th className="py-3 px-3">Nama Produk</th>
                      <th className="py-3 px-3">Bin / Rak</th>
                      <th className="py-3 px-3">Nomor Lot</th>
                      <th className="py-3 px-3">Kedaluwarsa</th>
                      <th className="py-3 px-3 text-right font-bold">Qty Fisik</th>
                      <th className="py-3 px-3 text-right font-semibold text-[#2d6a4f]">Qty Available</th>
                      <th className="py-3 px-3 text-center">UOM</th>
                      <th className="py-3 px-3 text-right">Harga Satuan</th>
                      <th className="py-3 px-3 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1ee]">
                    {data.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/inventory/${row.product.id}`)}
                        className="cursor-pointer transition hover:bg-[#f1f8f4]"
                      >
                        <td className="py-3 px-3">
                          <StatusBadge status={row.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#1b2a24]">
                          {row.product.kfaCode}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#1b2a24]">
                          <span className="text-[#2d6a4f] hover:underline font-semibold">{row.product.name}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#52665d]">{row.bin || '—'}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#1b2a24] font-medium">{row.lot}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#52665d]">
                          {formatDate(row.expiry, 'iso')}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">{formatQuantity(row.qtyOnHand)}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#2d6a4f]">
                          {formatQuantity(Math.max(0, row.qtyOnHand - (row.qtyReserved ?? 0)))}
                        </td>
                        <td className="py-3 px-3 text-center text-[#52665d]">{row.product.uom || 'Tablet'}</td>
                        <td className="py-3 px-3 text-right text-[#52665d]">{formatCurrency(row.product.price)}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                          {formatCurrency(row.qtyOnHand * row.product.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && totalCount > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 sm:flex-row">
                <p className="text-xs text-[#6b7c74]">
                  Menampilkan <span className="font-semibold text-[#1b2a24]">{(page - 1) * PAGE_SIZE + 1}</span> s/d{' '}
                  <span className="font-semibold text-[#1b2a24]">{Math.min(page * PAGE_SIZE, totalCount)}</span> dari{' '}
                  <span className="font-semibold text-[#1b2a24]">{totalCount}</span> entri
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe6e2] bg-white text-[#52665d] transition hover:bg-[#f1f5f3] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                        page === p
                          ? 'bg-[#2d6a4f] text-white'
                          : 'border border-[#dfe6e2] bg-white text-[#52665d] hover:bg-[#f1f5f3]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe6e2] bg-white text-[#52665d] transition hover:bg-[#f1f5f3] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Filter,
  PackageX,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '@/shared/ui';
import { formatCurrency, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getReorderReport } from './api';
import type { ReorderReportItem } from './api';
import { useAuth } from '@/features/auth/AuthProvider';

const PAGE_SIZE = 25;

export function ReorderReport() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateRequisition = role !== null && ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST'].includes(role);
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<ReorderReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [appliedCategory, setAppliedCategory] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL'); // ALL | OUT_OF_STOCK | LOW_STOCK

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!activeLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReorderReport({ locationId: activeLocationId });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan rekomendasi reorder');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach((item) => {
      if (item.product.category) cats.add(item.product.category);
    });
    return Array.from(cats).sort();
  }, [data]);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (appliedCategory !== 'ALL' && item.product.category !== appliedCategory) {
        return false;
      }
      if (urgencyFilter === 'OUT_OF_STOCK' && item.qtyOnHand > 0) {
        return false;
      }
      if (urgencyFilter === 'LOW_STOCK' && item.qtyOnHand === 0) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.product.name.toLowerCase().includes(q);
        const matchCode = item.product.kfaCode.toLowerCase().includes(q);
        const matchZat = (item.product.zatAktif || '').toLowerCase().includes(q);
        const matchCat = (item.product.category || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchZat && !matchCat) return false;
      }
      return true;
    });
  }, [data, appliedCategory, urgencyFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  // KPI Calculations
  const totalItems = filteredData.length;
  const totalSuggestedUnits = filteredData.reduce((acc, it) => acc + it.suggestedQty, 0);
  const totalEstimatedCost = filteredData.reduce((acc, it) => acc + (it.suggestedQty * (it.product.price || 5000)), 0);

  const handleApplyFilter = () => {
    setAppliedCategory(categoryFilter);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setCategoryFilter('ALL');
    setAppliedCategory('ALL');
    setUrgencyFilter('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleDownloadCsv = () => {
    if (!filteredData.length) return;
    const headers = [
      'Kode KFA',
      'Nama Produk',
      'Zat Aktif',
      'Kategori',
      'Qty Fisik Saat Ini',
      'Reorder Point',
      'Qty Disarankan',
      'Satuan (UOM)',
      'Harga Satuan (IDR)',
      'Estimasi Anggaran (IDR)',
    ];
    const rows = filteredData.map((r) => [
      `"${r.product.kfaCode}"`,
      `"${r.product.name.replace(/"/g, '""')}"`,
      `"${(r.product.zatAktif || '').replace(/"/g, '""')}"`,
      `"${(r.product.category || '').replace(/"/g, '""')}"`,
      r.qtyOnHand,
      r.reorderPoint,
      r.suggestedQty,
      `"${r.product.uom || 'Tablet'}"`,
      r.product.price || 5000,
      r.suggestedQty * (r.product.price || 5000),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekomendasi_Reorder_${activeLocationId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Laporan Reorder" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/inventory/overview"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Ringkasan Persediaan
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadCsv}
              disabled={filteredData.length === 0}
            >
              Ekspor CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={() => router.push('/procurement/new')}
            >
              + Buat PO Pengadaan
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1b2a24]">Rekomendasi Reorder (Replenishment)</h1>
              <p className="mt-1 max-w-4xl text-xs leading-relaxed text-[#52665d]">
                Daftar persediaan obat dan bahan medis habis pakai yang stok fisiknya telah berada di bawah batas titik pemesanan ulang (Reorder Point).
                Gunakan rekomendasi kuantitas ini untuk segera menerbitkan pesanan pembelian (*Purchase Order*) atau *Requisition* unit.
              </p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-[#2d6a4f] bg-[#e8f5e9] px-3.5 py-2 rounded-xl border border-[#c8e6c9]">
              Fasilitas: {activeLocationId}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Item Perlu Reorder</span>
            <AlertTriangle className="h-4 w-4 text-[#52665d]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{totalItems} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Stok menipis atau kosong di bawah ROP</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Unit Dibutuhkan</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatQuantity(totalSuggestedUnits)} Unit</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Kuantitas usulan pemenuhan (Suggested Qty)</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Estimasi Anggaran Pengadaan</span>
            <ShoppingCart className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalEstimatedCost)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Berdasarkan HET KFA acuan distributor</p>
        </div>
      </div>

      {/* 3. Main Grid: Filter Sidebar (Left) + Table View (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Filter Sidebar */}
        <aside className="space-y-4 lg:col-span-3">
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1b2a24]">
                <Filter className="h-4 w-4 text-[#2d6a4f]" />
                <span>Filter Reorder</span>
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
              {/* Category Select */}
              <div className="space-y-1.5">
                <label htmlFor="reorder-category" className="block text-xs font-semibold text-[#31483c]">
                  Kategori Obat
                </label>
                <div className="relative">
                  <select
                    id="reorder-category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#d8e2dc] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="ALL">Semua Kategori ({categories.length})</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7c74]" />
                </div>
              </div>

              {/* Urgency Level Select */}
              <div className="space-y-1.5">
                <label htmlFor="urgency-filter" className="block text-xs font-semibold text-[#31483c]">
                  Tingkat Urgensi
                </label>
                <div className="relative">
                  <select
                    id="urgency-filter"
                    value={urgencyFilter}
                    onChange={(e) => {
                      setUrgencyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full appearance-none rounded-xl border border-[#d8e2dc] bg-[#f8faf9] px-3 py-2 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]"
                  >
                    <option value="ALL">Semua Tingkat Urgensi</option>
                    <option value="OUT_OF_STOCK">Stok Habis / Kritis (QoH = 0)</option>
                    <option value="LOW_STOCK">Menipis di Bawah ROP (QoH &gt; 0)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6b7c74]" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d6a4f] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1b4332]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Terapkan Filter
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={filteredData.length === 0}
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
                  Daftar Kebutuhan Reorder — Menampilkan {filteredData.length} item
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca8a2]" />
                <input
                  type="text"
                  placeholder="Cari obat / kode KFA…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] pl-9 pr-3 text-xs text-[#1b2a24] outline-none transition placeholder:text-[#9ca8a2] focus:border-[#2d6a4f] focus:bg-white"
                />
              </div>
            </div>

            {/* Table Area */}
            {paginatedRows.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  title="Tidak ada item reorder"
                  description="Seluruh persediaan saat ini dalam batas aman atau tidak cocok dengan filter."
                  icon={<Boxes className="w-8 h-8 text-[#9ca8a2]" />}
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Kode KFA</th>
                      <th className="py-3 px-3">Nama Produk Obat</th>
                      <th className="py-3 px-3">Kategori</th>
                      <th className="py-3 px-3 text-right">Stok Fisik</th>
                      <th className="py-3 px-3 text-right">Titik ROP</th>
                      <th className="py-3 px-3 text-right font-bold text-[#2d6a4f]">Qty Disarankan</th>
                      <th className="py-3 px-3 text-right">Harga Satuan</th>
                      <th className="py-3 px-3 text-right">Estimasi Nilai</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1ee]">
                    {paginatedRows.map((it) => (
                      <tr key={it.product.id} className="transition hover:bg-[#f1f8f4]">
                        {/* Status */}
                        <td className="py-3 px-3">
                          {it.qtyOnHand === 0 ? (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                              Stok Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                              Di Bawah ROP
                            </span>
                          )}
                        </td>

                        {/* Kode KFA */}
                        <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#1b2a24]">
                          {it.product.kfaCode}
                        </td>

                        {/* Product Name */}
                        <td className="py-3 px-3">
                          <Link
                            href={`/inventory/${it.product.id}`}
                            className="font-medium text-[#2d6a4f] hover:underline font-semibold"
                          >
                            {it.product.name}
                          </Link>
                          {it.product.zatAktif && (
                            <div className="text-[11px] text-[#6b7c74]">{it.product.zatAktif}</div>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-[#52665d]">{it.product.category || 'Obat'}</td>

                        {/* QoH */}
                        <td className="py-3 px-3 text-right">
                          <span className={`font-bold ${it.qtyOnHand <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {formatQuantity(it.qtyOnHand)}
                          </span>
                        </td>

                        {/* Reorder Point */}
                        <td className="py-3 px-3 text-right text-[#52665d]">{formatQuantity(it.reorderPoint)}</td>

                        {/* Suggested Quantity */}
                        <td className="py-3 px-3 text-right font-bold text-[#2d6a4f]">
                          {formatQuantity(it.suggestedQty)}
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-3 text-right text-[#52665d]">{formatCurrency(it.product.price || 5000)}</td>

                        {/* Total Estimated Cost */}
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                          {formatCurrency(it.suggestedQty * (it.product.price || 5000))}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {canCreateRequisition && (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<ClipboardList className="w-3.5 h-3.5" />}
                                onClick={() => router.push(`/requisitions/create?prefill=${it.product.id}`)}
                              >
                                Requisition
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                              onClick={() => router.push(`/procurement/new?product=${it.product.id}`)}
                            >
                              PO
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 sm:flex-row">
                <p className="text-xs text-[#6b7c74]">
                  Menampilkan <span className="font-semibold text-[#1b2a24]">{(currentPage - 1) * PAGE_SIZE + 1}</span> s/d{' '}
                  <span className="font-semibold text-[#1b2a24]">
                    {Math.min(currentPage * PAGE_SIZE, filteredData.length)}
                  </span>{' '}
                  dari <span className="font-semibold text-[#1b2a24]">{filteredData.length}</span> item
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dfe6e2] bg-white text-[#52665d] transition hover:bg-[#f1f5f3] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
                        currentPage === p
                          ? 'bg-[#2d6a4f] text-white'
                          : 'border border-[#dfe6e2] bg-white text-[#52665d] hover:bg-[#f1f5f3]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

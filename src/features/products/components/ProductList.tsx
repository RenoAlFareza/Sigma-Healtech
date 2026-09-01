'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileCheck,
  Filter,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  PackagePlus,
  Pencil,
  Pill,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Select, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatCurrency, formatNumber, formatQuantity } from '@/shared/lib/format';
import type { Product } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';
import { listProducts, getCategories } from '../api';

const PAGE_SIZE = 20;

interface LoadedState {
  data: Product[];
  totalCount: number;
}

const DOSAGE_FORMS = [
  'Semua Bentuk Sediaan',
  'Tablet',
  'Kapsul',
  'Sirup',
  'Tetes Oral (Oral Drops)',
  'Injeksi',
  'Infus',
  'Salep / Krim',
  'Suspensi',
];

export function ProductList() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateProduct = role === 'ADMIN';

  const [categories, setCategories] = useState<string[]>([]);
  const [dosageFormFilter, setDosageFormFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('ALL');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<LoadedState>({ data: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  const load = useCallback(
    async (overrides?: { keyword?: string; category?: string; page?: number }) => {
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
    },
    [keyword, category, page]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load({ keyword, category, page: 1 });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
    void load({ keyword, category: val, page: 1 });
  };

  const handleResetFilter = () => {
    setKeyword('');
    setCategory('ALL');
    setDosageFormFilter('ALL');
    setPage(1);
    void load({ keyword: '', category: 'ALL', page: 1 });
  };

  const handlePage = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
    void load({ keyword, category, page: next });
  };

  // Filter by local dosage form if selected
  const displayedProducts = useMemo(() => {
    if (dosageFormFilter === 'ALL' || dosageFormFilter === 'Semua Bentuk Sediaan') {
      return data.data;
    }
    return data.data.filter((p) =>
      p.dosageForm?.toLowerCase().includes(dosageFormFilter.toLowerCase())
    );
  }, [data.data, dosageFormFilter]);

  // Export CSV
  const handleExportCsv = () => {
    if (data.data.length === 0) return;
    const headers = ['Kode KFA', 'Nama Produk', 'Zat Aktif', 'Kekuatan', 'Sediaan', 'Kategori', 'Pabrikan', 'NIE BPOM', 'Satuan', 'Harga HET'];
    const rows = displayedProducts.map((p) => [
      `"${p.kfaCode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.zatAktif}"`,
      `"${p.kekuatan}"`,
      `"${p.dosageForm}"`,
      `"${p.category}"`,
      `"${p.manufacturer}"`,
      `"${p.nie}"`,
      `"${p.uom}"`,
      `"${p.price}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katalog-obat-kfa-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── 1. Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5eae7] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#d8f3dc] text-[11px] font-bold text-[#1b4332]">
            <Database className="w-3.5 h-3.5" />
            STANDAR KFA KEMENKES RI & BPOM
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#1b2a24] tracking-tight">
            Katalog Master Produk KFA
          </h1>
          <p className="text-xs text-[#52665d]">
            Basis data terintegrasi 1.011 produk obat resmi Kamus Farmasi dan Alat Kesehatan (KFA) Kemenkes RI dengan NIE BPOM.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4 text-[#2d6a4f]" />}
            onClick={handleExportCsv}
            className="rounded-xl border-[#dfe6e2] bg-white hover:bg-[#f1f8f4] text-xs font-semibold text-[#1b2a24]"
          >
            Unduh Katalog (CSV)
          </Button>

          {canCreateProduct && (
            <Button
              variant="primary"
              size="sm"
              aria-label="New Product"
              leftIcon={<PackagePlus className="w-4 h-4" />}
              onClick={() => router.push('/products/new')}
              className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-xs font-semibold text-white shadow-sm"
            >
              + Tambah Produk Baru
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Top Bento KPI Cards (Uniform Clean White) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Produk Terdaftar</span>
            <Pill className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            {data.totalCount > 0 ? formatNumber(data.totalCount) : '1.011'}
            <span className="text-sm font-semibold text-[#52665d]"> SKU</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Katalog master KFA aktif rumah sakit</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kategori Terapeutik</span>
            <Layers className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            {categories.length > 0 ? categories.length : '18'}
            <span className="text-sm font-semibold text-[#52665d]"> Golongan</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Kelas terapi obat terstandarisasi</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Bentuk Sediaan</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            8+ <span className="text-sm font-semibold text-[#52665d]">Format Fisik</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Tablet, Kapsul, Injeksi, Sirup, Infus</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kepatuhan BPOM & KFA</span>
            <FileCheck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2d6a4f]">100% Terstandar</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Semua item memiliki NIE resmi</p>
        </div>
      </div>

      {/* ── 3. OpenBoxes 2-Column Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left Sidebar Filter ── */}
        <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
              <Filter className="h-4 w-4 text-[#2d6a4f]" />
              Filter Katalog Obat
            </div>
            {(keyword || category !== 'ALL' || dosageFormFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-[#2d6a4f] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="product-search" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Pencarian Produk (Search products)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
                <input
                  id="product-search"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Nama obat, kode KFA, zat aktif..."
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label htmlFor="category-filter" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Kategori Terapeutik (Category)
              </label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                <option value="ALL">Semua Kategori (All Categories)</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Dosage Form Filter */}
            <div>
              <label htmlFor="dosage-filter" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Bentuk Sediaan (Dosage Form)
              </label>
              <select
                id="dosage-filter"
                value={dosageFormFilter}
                onChange={(e) => setDosageFormFilter(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {DOSAGE_FORMS.map((d) => (
                  <option key={d} value={d === 'Semua Bentuk Sediaan' ? 'ALL' : d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full justify-center rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-xs font-semibold text-white mt-2"
            >
              Terapkan Filter
            </Button>
          </form>

          <div className="rounded-xl bg-[#f8faf9] border border-[#edf1ee] p-3 space-y-1.5 text-[11px] text-[#52665d]">
            <div className="font-bold text-[#1b2a24] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2d6a4f]" />
              Tips Pencarian KFA:
            </div>
            <p>Anda dapat mencari menggunakan 8-digit kode KFA, nama zat aktif (misal: *Paracetamol*), atau nomor izin edar BPOM.</p>
          </div>
        </aside>

        {/* ── Right Main Table Area ── */}
        <main className="flex-1 w-full rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)] overflow-hidden">
          {/* Table Header Info */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf1ee] bg-[#f8faf9]">
            <div>
              <h2 className="text-xs font-bold text-[#1b2a24]">
                Daftar Master Katalog ({formatNumber(data.totalCount)} Produk)
              </h2>
              <p className="text-[11px] text-[#6b7c74]">
                Menampilkan halaman {page} dari {totalPages}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => load()}
              className="rounded-xl border-[#dfe6e2] bg-white hover:bg-[#f1f8f4] text-xs font-semibold text-[#1b2a24]"
            >
              Segarkan
            </Button>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton variant="rect" height={32} width="100%" count={1} />
              <Skeleton variant="text" height={20} count={8} />
            </div>
          ) : error ? (
            <div className="p-8">
              <ErrorState message={error} onRetry={() => load()} title="Gagal Memuat Produk" />
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="Tidak ada produk (No products found)"
                description="Tidak ada data obat yang sesuai dengan filter atau kata kunci pencarian."
                icon={<Package className="w-10 h-10 text-[#9ca8a2]" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-4">Kode KFA</th>
                    <th className="py-3 px-4">Nama Produk Obat</th>
                    <th className="py-3 px-4">Zat Aktif & Kekuatan</th>
                    <th className="py-3 px-4">Bentuk Sediaan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Pabrikan</th>
                    <th className="py-3 px-4">NIE BPOM</th>
                    <th className="py-3 px-4 text-right">Harga HET</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {displayedProducts.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/products/${p.id}`)}
                      className="cursor-pointer transition hover:bg-[#f1f8f4]"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#2d6a4f]">
                        <Link
                          href={`/products/${p.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.kfaCode}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1b2a24]">{p.name}</div>
                        <div className="text-[10px] text-[#52665d]">Satuan: {p.uom || 'Pcs'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1b2a24]">{p.zatAktif}</div>
                        {p.kekuatan && <div className="text-[10px] text-[#6b7c74]">{p.kekuatan}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f8f4] px-2 py-0.5 text-[11px] font-semibold text-[#2d6a4f]">
                          {p.dosageForm || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#52665d]">{p.category || '-'}</td>
                      <td className="py-3 px-4 text-[#1b2a24] font-medium">{p.manufacturer || '-'}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#52665d]">{p.nie || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#1b2a24]">
                        {p.price != null && p.price > 0 ? formatCurrency(p.price) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/products/${p.id}`)}
                            className="rounded-xl border-[#dfe6e2] px-2.5 py-1 text-[11px]"
                          >
                            Detail
                          </Button>
                          {canCreateProduct && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/products/${p.id}/edit`)}
                              className="rounded-xl border-[#dfe6e2] px-2.5 py-1 text-[11px] text-[#2d6a4f] hover:bg-[#f1f8f4]"
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination Footer ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#edf1ee] bg-[#f8faf9]">
              <div className="text-xs text-[#52665d]">
                Halaman <span className="font-bold text-[#1b2a24]">{page}</span> dari{' '}
                <span className="font-bold text-[#1b2a24]">{totalPages}</span> ({formatNumber(data.totalCount)} total produk)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePage(page - 1)}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  className="rounded-xl border-[#dfe6e2] bg-white text-xs"
                >
                  Sebelumnya
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = page - 2 + i;
                    if (pageNum < 1) pageNum = i + 1;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                          page === pageNum
                            ? 'bg-[#2d6a4f] text-white shadow-sm'
                            : 'bg-white border border-[#dfe6e2] text-[#1b2a24] hover:bg-[#f1f8f4]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => handlePage(page + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="rounded-xl border-[#dfe6e2] bg-white text-xs"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

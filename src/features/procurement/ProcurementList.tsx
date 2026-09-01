'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Select, Skeleton, StatusBadge } from '@/shared/ui';
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/format';
import { listPOs } from './api';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

const SUPPLIER_OPTIONS = [
  { value: 'ALL', label: 'Semua Distributor (PBF)' },
  { value: 'PT Kimia Farma Trading & Distribution', label: 'PT Kimia Farma Trading & Distribution' },
  { value: 'PT Kalbe Farma Tbk', label: 'PT Kalbe Farma Tbk' },
  { value: 'PT Anugrah Argon Medica', label: 'PT Anugrah Argon Medica' },
  { value: 'PT Afifarma Farma', label: 'PT Afifarma Farma' },
  { value: 'PT Tempo Scan Pacific', label: 'PT Tempo Scan Pacific' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status PO' },
  { value: 'PENDING', label: 'Draf Menunggu Otorisasi (PENDING)' },
  { value: 'APPROVED', label: 'Disetujui / Siap Kirim (APPROVED)' },
  { value: 'PLACED', label: 'Terkirim ke Pemasok (PLACED)' },
  { value: 'PARTIALLY_RECEIVED', label: 'Sebagian Diterima (PARTIAL)' },
  { value: 'RECEIVED', label: 'Selesai Diterima Lengkap (RECEIVED)' },
  { value: 'CANCELLED', label: 'Dibatalkan (CANCELLED)' },
];

export function ProcurementList() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreatePO = role !== null && ['BUYER', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);

  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied Filter States
  const [appliedSupplier, setAppliedSupplier] = useState('ALL');
  const [appliedStatus, setAppliedStatus] = useState<string>('ALL');
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPOs({});
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar PO');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSupplier(selectedSupplier);
    setAppliedStatus(selectedStatus);
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const handleResetFilter = () => {
    setSelectedSupplier('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setAppliedSupplier('ALL');
    setAppliedStatus('ALL');
    setAppliedSearch('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((po) => {
      if (appliedSupplier !== 'ALL' && !po.supplierName.toLowerCase().includes(appliedSupplier.toLowerCase())) {
        return false;
      }
      if (appliedStatus !== 'ALL' && po.status !== appliedStatus) {
        return false;
      }
      if (appliedSearch) {
        const matchNumber = po.poNumber.toLowerCase().includes(appliedSearch);
        const matchSupplier = po.supplierName.toLowerCase().includes(appliedSearch);
        const matchItem = po.items.some((it) => it.productId.toLowerCase().includes(appliedSearch));
        if (!matchNumber && !matchSupplier && !matchItem) return false;
      }
      return true;
    });
  }, [data, appliedSupplier, appliedStatus, appliedSearch]);

  // Metric Computations
  const activePOs = useMemo(() => {
    return data.filter((po) => ['PENDING', 'APPROVED', 'PLACED', 'PARTIALLY_RECEIVED'].includes(po.status));
  }, [data]);

  const totalActiveValue = useMemo(() => {
    return activePOs.reduce((acc, po) => acc + (po.total || 0), 0);
  }, [activePOs]);

  const completedCount = useMemo(() => {
    return data.filter((po) => po.status === 'RECEIVED').length;
  }, [data]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'Nomor PO',
      'Pemasok (Distributor)',
      'Status PO',
      'Tanggal Pemesanan',
      'Jumlah SKU',
      'Total Nilai (Rp)',
    ];

    const rows = filteredData.map((po) => [
      `"${po.poNumber}"`,
      `"${po.supplierName}"`,
      `"${po.status}"`,
      `"${formatDate(po.createdAt, 'short')}"`,
      po.items?.length ?? 0,
      po.total ?? 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Purchase_Order_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <Skeleton className="w-full lg:w-72 h-96 rounded-2xl" />
          <Skeleton className="flex-1 h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Purchase Order" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Purchase Orders (Pengadaan Obat)
          </h1>
          <p className="text-xs text-[#52665d] mt-1">
            Kelola pengadaan logistik farmasi, surat pesanan resmi ke PBF, dan verifikasi penerimaan barang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreatePO && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/procurement/new')}
            >
              Buat PO Baru
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Bento KPI Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Nilai PO Aktif</span>
            <Coins className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalActiveValue)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Akumulasi nilai pesanan yang belum selesai</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">PO Dalam Proses / Terkirim</span>
            <Truck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{activePOs.length} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Pesanan menunggu pengiriman distributor</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">PO Selesai Diterima</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{completedCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Barang telah masuk ke gudang farmasi</p>
        </div>
      </div>

      {/* 3. OpenBoxes 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Filter */}
        <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
              <Filter className="h-4 w-4 text-[#2d6a4f]" />
              Filter Purchase Order
            </div>
            {(appliedSupplier !== 'ALL' || appliedStatus !== 'ALL' || appliedSearch) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-semibold text-[#2d6a4f] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div>
              <label htmlFor="po-search-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Pencarian Cepat
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
                <input
                  id="po-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="No. PO, Pemasok, SKU..."
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="po-supplier-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Distributor / Pemasok (PBF)
              </label>
              <select
                id="po-supplier-select"
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {SUPPLIER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="po-status-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Status Dokumen PO
              </label>
              <select
                id="po-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" variant="primary" size="sm" className="w-full">
                Terapkan Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportCsv}
                disabled={filteredData.length === 0}
              >
                Ekspor CSV (Excel)
              </Button>
            </div>
          </form>
        </aside>

        {/* Right PO Table */}
        <main className="flex-1 w-full rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#2d6a4f]">
                Daftar Dokumen Purchase Order
              </h2>
              <p className="text-[11px] text-[#6b7c74]">
                Menampilkan <span className="font-bold text-[#1b2a24]">{filteredData.length}</span> dari {data.length} dokumen pesanan
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchData}
            >
              Segarkan
            </Button>
          </div>

          {filteredData.length === 0 ? (
            <EmptyState
              title="Tidak ada Purchase Order yang cocok"
              description="Coba ubah kriteria pencarian atau atur ulang filter distributor dan status."
              icon={<ShoppingCart className="w-8 h-8 text-[#9ca8a2]" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Nomor PO</th>
                    <th className="py-3 px-3">Distributor (PBF)</th>
                    <th className="py-3 px-3">Gudang Tujuan</th>
                    <th className="py-3 px-3">Tanggal Pesan</th>
                    <th className="py-3 px-3 text-center">Jumlah SKU</th>
                    <th className="py-3 px-3 text-right">Progress</th>
                    <th className="py-3 px-3 text-right">Total Nilai (Rp)</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {filteredData.map((po) => {
                    const receivedUnits = po.items.reduce((acc, it) => acc + (it.qtyReceived || 0), 0);
                    const totalUnits = po.items.reduce((acc, it) => acc + it.qty, 0);
                    const percent = Math.round((receivedUnits / (totalUnits || 1)) * 100);

                    return (
                      <tr
                        key={po.id}
                        onClick={() => router.push(`/procurement/${po.id}`)}
                        className="cursor-pointer transition hover:bg-[#f1f8f4]"
                      >
                        <td className="py-3 px-3">
                          <StatusBadge status={po.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">
                          <Link
                            href={`/procurement/${po.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {po.poNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1b2a24]">
                          {po.supplierName}
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          Gudang Farmasi Pusat
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {formatDate(po.createdAt, 'short')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#1b2a24]">
                          {po.items?.length ?? 0} SKU
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-[#1b2a24]">{percent}%</div>
                          <div className="text-[10px] text-[#6b7c74] font-mono">
                            {formatNumber(receivedUnits)} / {formatNumber(totalUnits)}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                          {formatCurrency(po.total)}
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/procurement/${po.id}`)}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

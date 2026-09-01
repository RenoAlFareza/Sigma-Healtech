'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Skeleton, StatusBadge } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { listOutbound } from './api';
import type { MovementStatus, StockMovement } from '@/shared/types/domain';

const DESTINATION_OPTIONS = [
  { value: 'ALL', label: 'Semua Unit Tujuan' },
  { value: 'depo-rawat-inap', label: 'Depo Rawat Inap (DRI)' },
  { value: 'depo-igd', label: 'Depo IGD (DIGD)' },
  { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan (ARJ)' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status Pengeluaran' },
  { value: 'DRAFT', label: 'DRAFT — Draf Pengeluaran' },
  { value: 'ITEMS', label: 'ITEMS — Pemilihan Item Obat' },
  { value: 'PICKING', label: 'PICKING — Sedang Diambil di Rak' },
  { value: 'PACKED', label: 'PACKED — Selesai Dikemas & Segel' },
  { value: 'DISPATCHED', label: 'DISPATCHED — Dalam Pengiriman' },
  { value: 'RECEIVED', label: 'RECEIVED — Telah Diterima Unit' },
];

export function OutboundList() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateOutbound = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);
  const { activeLocationId } = useActiveLocation();

  // Raw Filter States
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied Filter States
  const [appliedDestination, setAppliedDestination] = useState('ALL');
  const [appliedStatus, setAppliedStatus] = useState('ALL');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [data, setData] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listOutbound({
        status: appliedStatus === 'ALL' ? undefined : (appliedStatus as MovementStatus),
        originId: activeLocationId ?? undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar pengeluaran outbound');
    } finally {
      setLoading(false);
    }
  }, [appliedStatus, activeLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedDestination(selectedDestination);
    setAppliedStatus(selectedStatus);
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const handleResetFilter = () => {
    setSelectedDestination('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setAppliedDestination('ALL');
    setAppliedStatus('ALL');
    setAppliedSearch('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((m) => {
      if (appliedDestination !== 'ALL' && m.destinationId !== appliedDestination) return false;
      if (appliedSearch) {
        const matchNumber = m.movementNumber.toLowerCase().includes(appliedSearch);
        const matchDest = (m.destinationId || '').toLowerCase().includes(appliedSearch);
        const matchType = (m.type || '').toLowerCase().includes(appliedSearch);
        const matchItem = m.items?.some((it) => it.productId.toLowerCase().includes(appliedSearch));
        if (!matchNumber && !matchDest && !matchType && !matchItem) return false;
      }
      return true;
    });
  }, [data, appliedDestination, appliedSearch]);

  // Metrics
  const inProgressCount = useMemo(() => {
    return data.filter((m) => m.status === 'PICKING' || m.status === 'PACKED').length;
  }, [data]);

  const completedCount = useMemo(() => {
    return data.filter((m) => m.status === 'DISPATCHED' || m.status === 'RECEIVED').length;
  }, [data]);

  const handleExportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'No. Outbound',
      'Tipe',
      'Gudang Asal',
      'Unit Tujuan',
      'Status',
      'Tanggal Dibuat',
      'Jumlah SKU',
      'Total Kuantitas',
    ];

    const rows = filteredData.map((m) => [
      `"${m.movementNumber}"`,
      `"${m.type}"`,
      `"${m.originId}"`,
      `"${m.destinationId}"`,
      `"${m.status}"`,
      `"${formatDate(m.createdAt, 'short')}"`,
      m.items?.length || 0,
      m.items?.reduce((acc, it) => acc + it.qty, 0) || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Outbound_${new Date().toISOString().slice(0, 10)}.csv`);
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
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Outbound" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Pengeluaran Gudang FEFO (Outbound Movements)
          </h1>
          <p className="text-xs text-[#52665d] mt-1">
            Eksekusi alur pengeluaran obat berdasarkan prinsip First-Expired, First-Out (FEFO), packing koli, dan surat jalan dispatch.
          </p>
        </div>

        {canCreateOutbound && (
          <Link
            href="/outbound/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b4332]"
          >
            <Plus className="w-4 h-4" />
            + Buat Outbound FEFO
          </Link>
        )}
      </div>

      {/* 2. Top Bento KPI Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Dokumen Pengeluaran</span>
            <Truck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{data.length} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Pergerakan stok keluar dari gudang</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Sedang Diproses (Pick/Pack)</span>
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{inProgressCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Dalam tahap pengambilan di rak & kemas koli</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Selesai Dikirim (Dispatched)</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{completedCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Telah diterbitkan surat jalan pengiriman</p>
        </div>
      </div>

      {/* 3. OpenBoxes 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Filter */}
        <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
              <Filter className="h-4 w-4 text-[#2d6a4f]" />
              Filter Pengeluaran
            </div>
            {(appliedStatus !== 'ALL' || appliedDestination !== 'ALL' || appliedSearch) && (
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
              <label htmlFor="ob-search-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Pencarian Cepat
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
                <input
                  id="ob-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="No. Outbound, Tujuan, SKU..."
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ob-destination-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Unit Tujuan
              </label>
              <select
                id="ob-destination-select"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {DESTINATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ob-status-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Status Pengeluaran
              </label>
              <select
                id="ob-status-select"
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
                Ekspor CSV
              </Button>
            </div>
          </form>
        </aside>

        {/* Right Outbound Table */}
        <main className="flex-1 w-full rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#2d6a4f]">
                Daftar Dokumen Pengeluaran Barang (Stock Movements)
              </h2>
              <p className="text-[11px] text-[#6b7c74]">
                Menampilkan <span className="font-bold text-[#1b2a24]">{filteredData.length}</span> dari {data.length} dokumen
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
              title="Tidak ada outbound"
              description="Belum ada pergerakan stok keluar atau tidak ada dokumen yang sesuai filter."
              icon={<Package className="w-8 h-8 text-[#9ca8a2]" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">No. Outbound</th>
                    <th className="py-3 px-3">Tipe</th>
                    <th className="py-3 px-3">Gudang Asal</th>
                    <th className="py-3 px-3">Unit Tujuan</th>
                    <th className="py-3 px-3">Tanggal Dibuat</th>
                    <th className="py-3 px-3 text-center">Jumlah SKU</th>
                    <th className="py-3 px-3 text-right">Total Unit</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {filteredData.map((m) => {
                    const totalUnits = m.items?.reduce((acc, it) => acc + it.qty, 0) || 0;

                    return (
                      <tr
                        key={m.id}
                        onClick={() => router.push(`/outbound/${m.id}`)}
                        className="cursor-pointer transition hover:bg-[#f1f8f4]"
                      >
                        <td className="py-3 px-3">
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">
                          <Link
                            href={`/outbound/${m.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {m.movementNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-[#1b2a24]">{m.type}</span>
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {m.originId}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#1b2a24]">
                          {m.destinationId}
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {formatDate(m.createdAt, 'short')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#1b2a24]">
                          {m.items?.length || 0} SKU
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                          {formatQuantity(totalUnits)} Unit
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/outbound/${m.id}`)}
                          >
                            {m.status === 'PICKING' ? 'Proses Pick' : (m.status === 'PACKED' ? 'Dispatch' : 'Detail')}
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

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Select, Skeleton, StatusBadge } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { listInbound } from './api';
import type { InboundReceipt, InboundStatus } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'Semua Sumber Pengiriman' },
  { value: 'SUPPLIER', label: 'Pemasok / Distributor Farmasi (PBF)' },
  { value: 'TRANSFER', label: 'Mutasi Transfer Antar-Depo' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status Penerimaan' },
  { value: 'CREATED', label: 'Menunggu Pemeriksaan Fisik (CREATED)' },
  { value: 'RECEIVING', label: 'Sedang Diperiksa & Dihitung (RECEIVING)' },
  { value: 'COMPLETED', label: 'Selesai Diterima di Staging (COMPLETED)' },
];

export function InboundList({ mode = 'receiving' }: { mode?: 'receiving' | 'putaway' }) {
  const router = useRouter();
  const { role } = useAuth();
  const canProcess = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);

  const [data, setData] = useState<InboundReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(mode === 'putaway' ? 'COMPLETED' : 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied Filter States
  const [appliedSource, setAppliedSource] = useState('ALL');
  const [appliedStatus, setAppliedStatus] = useState<string>(mode === 'putaway' ? 'COMPLETED' : 'ALL');
  const [appliedSearch, setAppliedSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listInbound(mode === 'putaway' ? { status: 'COMPLETED' } : {});
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar penerimaan');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSource(selectedSource);
    setAppliedStatus(selectedStatus);
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const handleResetFilter = () => {
    setSelectedSource('ALL');
    setSelectedStatus(mode === 'putaway' ? 'COMPLETED' : 'ALL');
    setSearchQuery('');
    setAppliedSource('ALL');
    setAppliedStatus(mode === 'putaway' ? 'COMPLETED' : 'ALL');
    setAppliedSearch('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      if (mode === 'putaway' && r.status !== 'COMPLETED') return false;
      if (appliedSource !== 'ALL' && r.sourceType !== appliedSource) return false;
      if (appliedStatus !== 'ALL' && r.status !== appliedStatus) return false;
      if (appliedSearch) {
        const matchNumber = r.receiptNumber.toLowerCase().includes(appliedSearch);
        const matchRef = (r.referenceId || '').toLowerCase().includes(appliedSearch);
        const matchItem = r.items.some((it) => it.productId.toLowerCase().includes(appliedSearch));
        if (!matchNumber && !matchRef && !matchItem) return false;
      }
      return true;
    });
  }, [data, mode, appliedSource, appliedStatus, appliedSearch]);

  // Metric Computations
  const pendingCount = useMemo(() => {
    return data.filter((r) => r.status === 'CREATED' || r.status === 'RECEIVING').length;
  }, [data]);

  const completedCount = useMemo(() => {
    return data.filter((r) => r.status === 'COMPLETED').length;
  }, [data]);

  const totalExpectedUnits = useMemo(() => {
    return data.reduce((acc, r) => acc + r.items.reduce((s, it) => s + it.qtyExpected, 0), 0);
  }, [data]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'No. Penerimaan (GRN)',
      'Sumber',
      'Dokumen Asal (Ref)',
      'Status',
      'Tanggal Dibuat',
      'Jumlah SKU',
      'Total Qty Diharapkan',
      'Total Qty Diterima',
    ];

    const rows = filteredData.map((r) => [
      `"${r.receiptNumber}"`,
      `"${r.sourceType}"`,
      `"${r.referenceId || '-'}"`,
      `"${r.status}"`,
      `"${formatDate(r.createdAt, 'short')}"`,
      r.items.length,
      r.items.reduce((s, it) => s + it.qtyExpected, 0),
      r.items.reduce((s, it) => s + (it.qtyReceived || 0), 0),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Inbound_Receiving_${new Date().toISOString().slice(0, 10)}.csv`);
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
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Penerimaan Inbound" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            {mode === 'putaway' ? 'Antrean Putaway (Alokasi Rak)' : 'Penerimaan Barang (Inbound Receiving)'}
          </h1>
          <p className="text-xs text-[#52665d] mt-1">
            {mode === 'putaway'
              ? 'Pilih penerimaan yang telah selesai di Staging Area untuk dialokasikan ke rak penyimpanan definitif.'
              : 'Verifikasi fisik barang tiba dari distributor farmasi (PBF) & mutasi antar-depo rumah sakit.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'receiving' && (
            <Link
              href="/inbound/putaway"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3]"
            >
              <Boxes className="w-4 h-4" />
              Ke Antrean Putaway
            </Link>
          )}
          {mode === 'putaway' && (
            <Link
              href="/inbound"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-2 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3]"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Ke Daftar Penerimaan
            </Link>
          )}
        </div>
      </div>

      {/* 2. Top Bento KPI Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Penerimaan Inbound</span>
            <Truck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{data.length} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total kiriman supplier & mutasi internal</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Menunggu Pemeriksaan Fisik</span>
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{pendingCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Perlu verifikasi Batch/Lot & ED obat</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Penerimaan Selesai (Staging)</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{completedCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Barang siap dialokasikan ke rak (Putaway)</p>
        </div>
      </div>

      {/* 3. OpenBoxes 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Filter */}
        <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
              <Filter className="h-4 w-4 text-[#2d6a4f]" />
              Filter Penerimaan
            </div>
            {(appliedSource !== 'ALL' || (mode === 'receiving' && appliedStatus !== 'ALL') || appliedSearch) && (
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
              <label htmlFor="inbound-search-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Pencarian Cepat
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
                <input
                  id="inbound-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="No. GRN, Dokumen Asal, SKU..."
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="inbound-source-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Asal Pengiriman
              </label>
              <select
                id="inbound-source-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {mode === 'receiving' && (
              <div>
                <label htmlFor="inbound-status-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                  Status Penerimaan
                </label>
                <select
                  id="inbound-status-select"
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
            )}

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

        {/* Right Inbound Table */}
        <main className="flex-1 w-full rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#2d6a4f]">
                {mode === 'putaway' ? 'Daftar Dokumen Siap Putaway' : 'Antrean Dokumen Penerimaan Barang'}
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
              title={mode === 'putaway' ? 'Belum ada penerimaan siap putaway' : 'Tidak ada dokumen penerimaan yang cocok'}
              description="Coba ubah kriteria pencarian atau atur ulang filter sumber dan status."
              icon={<Package className="w-8 h-8 text-[#9ca8a2]" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">No. GRN</th>
                    <th className="py-3 px-3">Sumber & Dokumen Asal</th>
                    <th className="py-3 px-3">Gudang Tujuan</th>
                    <th className="py-3 px-3">Tanggal Dibuat</th>
                    <th className="py-3 px-3 text-center">Jumlah SKU</th>
                    <th className="py-3 px-3 text-right">Kuantitas (Diterima / Harap)</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {filteredData.map((r) => {
                    const receivedUnits = r.items.reduce((acc, it) => acc + (it.qtyReceived || 0), 0);
                    const expectedUnits = r.items.reduce((acc, it) => acc + it.qtyExpected, 0);
                    const targetUrl = mode === 'putaway' ? `/inbound/putaway?id=${r.id}` : `/inbound?id=${r.id}`;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => router.push(targetUrl)}
                        className="cursor-pointer transition hover:bg-[#f1f8f4]"
                      >
                        <td className="py-3 px-3">
                          <StatusBadge status={r.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">
                          <Link
                            href={targetUrl}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.receiptNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1b2a24]">{r.sourceType}</div>
                          <div className="text-[10px] text-[#6b7c74] font-mono">
                            Ref: {r.referenceId || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          Gudang Farmasi Pusat
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {formatDate(r.createdAt, 'short')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#1b2a24]">
                          {r.items.length} SKU
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-[#1b2a24]">
                            {formatNumber(receivedUnits)} / {formatNumber(expectedUnits)}
                          </div>
                          <div className="text-[10px] text-[#6b7c74]">Unit Fisik</div>
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {canProcess ? (
                            <Button
                              variant={mode === 'putaway' ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => router.push(targetUrl)}
                            >
                              {mode === 'putaway' ? 'Putaway Rak' : (r.status === 'COMPLETED' ? 'Detail GRN' : 'Proses Fisik')}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(targetUrl)}
                            >
                              Detail GRN
                            </Button>
                          )}
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

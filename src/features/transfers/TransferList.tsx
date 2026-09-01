'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Search,
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { listTransfers } from './api';
import type { StockTransfer } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

export function TransferList() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateTransfer = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTransfers({ originId: activeLocationId ?? undefined });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transfer');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = (t.transferNumber || '').toLowerCase().includes(q);
        const matchOrig = (t.originId || '').toLowerCase().includes(q);
        const matchDest = (t.destinationId || '').toLowerCase().includes(q);
        if (!matchNum && !matchOrig && !matchDest) return false;
      }
      return true;
    });
  }, [data, statusFilter, searchQuery]);

  // KPI Metrics
  const totalCount = filteredData.length;
  const inTransitCount = filteredData.filter((t) => t.status === 'DRAFT' || t.status === 'APPROVED').length;
  const completedCount = filteredData.filter((t) => t.status === 'COMPLETED').length;

  const handleDownloadCsv = () => {
    if (!filteredData.length) return;
    const headers = ['Nomor Transfer', 'Lokasi Asal', 'Lokasi Tujuan', 'Status', 'Jumlah Item', 'Tanggal Dibuat'];
    const rows = filteredData.map((t) => [
      `"${t.transferNumber}"`,
      `"${t.originId}"`,
      `"${t.destinationId}"`,
      `"${t.status}"`,
      t.items?.length ?? 0,
      `"${t.createdAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Transfer_${new Date().toISOString().slice(0, 10)}.csv`);
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
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Transfer Stok" />;
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
            {canCreateTransfer && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => router.push('/transfers/new')}
              >
                + Buat Transfer Stok
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1b2a24]">Transfer Stok Antar-Depo</h1>
              <p className="mt-1 max-w-4xl text-xs leading-relaxed text-[#52665d]">
                Kelola distribusi dan pergerakan mutasi fisik obat antar-lokasi (Gudang Farmasi Pusat, Depo IGD, Depo Rawat Inap,
                dan Apotek).
              </p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-[#2d6a4f] bg-[#e8f5e9] px-3.5 py-2 rounded-xl border border-[#c8e6c9]">
              Fasilitas Asal: {activeLocationId ?? 'Semua'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Dokumen Transfer</span>
            <ArrowRightLeft className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{totalCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Riwayat mutasi internal</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Dalam Perjalanan / Diproses</span>
            <Truck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{inTransitCount} Transfer</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Menunggu konfirmasi penerimaan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Selesai Diterima</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{completedCount} Transfer</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Stok telah masuk di unit tujuan</p>
        </div>
      </div>

      {/* 3. Main Table Card with Toolbar */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between border-b border-[#edf1ee] pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca8a2]" />
              <input
                type="text"
                placeholder="Cari nomor / lokasi transfer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] pl-9 pr-3 text-xs text-[#1b2a24] outline-none transition placeholder:text-[#9ca8a2] focus:border-[#2d6a4f] focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Disetujui / Terkirim</option>
                <option value="COMPLETED">Selesai Diterima</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#6b7c74]">
            Menampilkan <span className="font-semibold text-[#1b2a24]">{filteredData.length}</span> transfer
          </div>
        </div>

        {/* Table Area */}
        {filteredData.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Tidak ada dokumen transfer"
              description="Belum ada transaksi transfer stok yang cocok dengan kriteria pencarian Anda."
              icon={<Boxes className="w-8 h-8 text-[#9ca8a2]" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">No. Transfer</th>
                  <th className="py-3 px-3">Lokasi Asal</th>
                  <th className="py-3 px-3">Lokasi Tujuan</th>
                  <th className="py-3 px-3 text-right">Jumlah Item</th>
                  <th className="py-3 px-3">Tanggal Dibuat</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {filteredData.map((t) => (
                  <tr
                    key={t.id}
                    className="transition hover:bg-[#f1f8f4]"
                  >
                    <td className="py-3 px-3">
                      <StatusBadge status={t.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#2d6a4f]">
                      {t.transferNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#52665d]">
                      {t.originId}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#1b2a24] font-medium">
                      {t.destinationId}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                      {formatQuantity(t.items?.length ?? 0)} SKU
                    </td>
                    <td className="py-3 px-3 text-[#52665d]">
                      {formatDate(t.createdAt, 'short')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/transfers/${t.id}`)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

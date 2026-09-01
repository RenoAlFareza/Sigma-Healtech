'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { createCycleCount, listCycleCounts } from './api';
import type { CycleCount } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

export function CycleCountManage() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateCount = role !== null && ['MANAGER', 'ADMIN'].includes(role);
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<CycleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCycleCounts({ locationId: activeLocationId ?? undefined });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat cycle count');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!activeLocationId) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createCycleCount({ locationId: activeLocationId, category });
      router.push(`/cycle-count/count?id=${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat sesi stock opname');
    } finally {
      setCreating(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = (c.countNumber || '').toLowerCase().includes(q);
        const matchLoc = (c.locationId || '').toLowerCase().includes(q);
        if (!matchNum && !matchLoc) return false;
      }
      return true;
    });
  }, [data, searchQuery]);

  // KPI Metrics
  const totalCount = filteredData.length;
  const inProgressCount = filteredData.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'RESOLVING').length;
  const completedCount = filteredData.filter((c) => c.status === 'COMPLETED').length;

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
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Stock Opname" />;
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

          {canCreateCount && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              isLoading={creating}
              onClick={handleCreate}
            >
              + Mulai Sesi Opname Baru
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1b2a24]">Stock Opname & Cycle Count</h1>
              <p className="mt-1 max-w-4xl text-xs leading-relaxed text-[#52665d]">
                Audit fisik persediaan berkala, pencatatan hitung buta (*blind count*), deteksi selisih kuantitas & nominal (*variance*),
                serta penyesuaian saldo buku besar kartu stok dengan otorisasi Apoteker.
              </p>
            </div>
            <div className="shrink-0 text-xs font-semibold text-[#2d6a4f] bg-[#e8f5e9] px-3.5 py-2 rounded-xl border border-[#c8e6c9]">
              Fasilitas Aktif: {activeLocationId ?? 'Semua'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Sesi Opname</span>
            <ClipboardList className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{totalCount} Sesi</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Audit berkala fasilitas</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Sedang Berjalan / Verifikasi</span>
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{inProgressCount} Sesi</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Menunggu hitung fisik atau selisih</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Selesai Direkonsiliasi</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{completedCount} Sesi</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Saldo buku besar telah disesuaikan</p>
        </div>
      </div>

      {/* 3. Main Data Card with Toolbar */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between border-b border-[#edf1ee] pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca8a2]" />
              <input
                type="text"
                placeholder="Cari nomor sesi opname…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] pl-9 pr-3 text-xs text-[#1b2a24] outline-none transition placeholder:text-[#9ca8a2] focus:border-[#2d6a4f] focus:bg-white"
              />
            </div>

            {/* Category Select */}
            <div className="w-full sm:w-56">
              <select
                id="cc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 text-xs font-medium text-[#1b2a24] outline-none transition focus:border-[#2d6a4f] focus:bg-white"
              >
                <option value="ALL">Pilih Kategori (Semua Kategori)</option>
                <option value="Analgesik/Antipiretik">Analgesik/Antipiretik</option>
                <option value="Antibiotik">Antibiotik</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
                <option value="Antihipertensi">Antihipertensi</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#6b7c74]">
            Menampilkan <span className="font-semibold text-[#1b2a24]">{filteredData.length}</span> sesi
          </div>
        </div>

        {/* Table Area */}
        {filteredData.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="Belum ada sesi stock opname"
              description="Klik tombol 'Mulai Sesi Opname Baru' di atas untuk menginisiasi proses audit fisik."
              icon={<ClipboardList className="w-8 h-8 text-[#9ca8a2]" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">No. Sesi Opname</th>
                  <th className="py-3 px-3">Lokasi Fasilitas</th>
                  <th className="py-3 px-3 text-right">Jumlah Item</th>
                  <th className="py-3 px-3">Tanggal Dibuat</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {filteredData.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() =>
                      c.status === 'COMPLETED'
                        ? router.push(`/cycle-count/report?id=${c.id}`)
                        : router.push(`/cycle-count/count?id=${c.id}`)
                    }
                    className="cursor-pointer transition hover:bg-[#f1f8f4]"
                  >
                    <td className="py-3 px-3">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#2d6a4f]">
                      {c.countNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#52665d]">
                      {c.locationId}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                      {formatQuantity(c.items?.length ?? 0)} SKU
                    </td>
                    <td className="py-3 px-3 text-[#52665d]">
                      {formatDate(c.createdAt, 'short')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (c.status === 'COMPLETED') {
                            router.push(`/cycle-count/report?id=${c.id}`);
                          } else {
                            router.push(`/cycle-count/count?id=${c.id}`);
                          }
                        }}
                      >
                        {c.status === 'COMPLETED' ? 'Laporan' : 'Proses Hitung'}
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

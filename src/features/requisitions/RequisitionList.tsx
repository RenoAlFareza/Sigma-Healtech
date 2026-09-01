'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Skeleton, StatusBadge } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { listRequisitions } from './api';
import type { ListRequisitionsParams } from './api';
import type { Requisition, RequisitionPriority, RequisitionStatus } from '@/shared/types/domain';

const ORIGIN_OPTIONS = [
  { value: 'ALL', label: 'Semua Unit Pemohon' },
  { value: 'depo-rawat-inap', label: 'Depo Rawat Inap (DRI)' },
  { value: 'depo-igd', label: 'Depo IGD (DIGD)' },
  { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan (ARJ)' },
];

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'Semua Tingkat Urgensi' },
  { value: 'RUTIN', label: 'ROUTINE — Permintaan Terjadwal' },
  { value: 'URGENT', label: 'URGENT — Kebutuhan Mendesak' },
  { value: 'EMERGENCY', label: 'EMERGENCY — Cito / Gawat Darurat' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status Permintaan' },
  { value: 'SUBMITTED', label: 'SUBMITTED — Menunggu Otorisasi Apoteker' },
  { value: 'APPROVED', label: 'APPROVED — Disetujui, Menunggu Pengambilan' },
  { value: 'PICKING', label: 'PICKING — Sedang Diambil di Rak Gudang' },
  { value: 'ISSUED', label: 'ISSUED — Barang Telah Diserahkan Lengkap' },
  { value: 'RECEIVED', label: 'RECEIVED — Diterima Lengkap di Unit Pemohon' },
  { value: 'REJECTED', label: 'REJECTED — Ditolak Apoteker' },
  { value: 'CREATED', label: 'CREATED — Draf Pengajuan' },
];

export function RequisitionList({ initialStatus = 'ALL' }: { initialStatus?: string }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const canCreate = role !== null && ['REQUESTOR', 'NURSE', 'PHARMACIST', 'ASSISTANT', 'MANAGER', 'ADMIN'].includes(role);
  const canApprove = role !== null && ['PHARMACIST', 'MANAGER', 'ADMIN'].includes(role);
  const requesterOnly = role === 'REQUESTOR' || role === 'VIEWER';

  // Raw Filter States
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedOrigin, setSelectedOrigin] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Applied Filter States
  const [appliedStatus, setAppliedStatus] = useState<string>(initialStatus);
  const [appliedOrigin, setAppliedOrigin] = useState('ALL');
  const [appliedPriority, setAppliedPriority] = useState('ALL');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [data, setData] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListRequisitionsParams = {
      status: appliedStatus === 'ALL' ? undefined : (appliedStatus as RequisitionStatus),
      originId: requesterOnly ? undefined : (appliedOrigin === 'ALL' ? undefined : appliedOrigin),
      requestedBy: requesterOnly ? user?.id : undefined,
    };
    try {
      const res = await listRequisitions(params);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat permintaan unit');
    } finally {
      setLoading(false);
    }
  }, [appliedStatus, appliedOrigin, requesterOnly, user?.id]);

  useEffect(() => {
    const requestId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(requestId);
  }, [fetchData]);

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedStatus(selectedStatus);
    setAppliedOrigin(selectedOrigin);
    setAppliedPriority(selectedPriority);
    setAppliedSearch(searchQuery.trim().toLowerCase());
  };

  const handleResetFilter = () => {
    setSelectedStatus('ALL');
    setSelectedOrigin('ALL');
    setSelectedPriority('ALL');
    setSearchQuery('');
    setAppliedStatus('ALL');
    setAppliedOrigin('ALL');
    setAppliedPriority('ALL');
    setAppliedSearch('');
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((r) => {
      if (appliedPriority !== 'ALL' && r.priority !== appliedPriority) return false;
      if (appliedSearch) {
        const matchNumber = r.requestNumber.toLowerCase().includes(appliedSearch);
        const matchOrigin = (r.originId || '').toLowerCase().includes(appliedSearch);
        const matchRequester = (r.requestedBy || '').toLowerCase().includes(appliedSearch);
        const matchItem = r.items?.some((it) => it.productId.toLowerCase().includes(appliedSearch));
        if (!matchNumber && !matchOrigin && !matchRequester && !matchItem) return false;
      }
      return true;
    });
  }, [data, appliedPriority, appliedSearch]);

  // Metric Computations
  const pendingApprovalCount = useMemo(() => {
    return data.filter((r) => r.status === 'SUBMITTED').length;
  }, [data]);

  const approvedCount = useMemo(() => {
    return data.filter((r) => r.status === 'APPROVED' || r.status === 'PICKING').length;
  }, [data]);

  const emergencyCount = useMemo(() => {
    return data.filter((r) => r.priority === 'EMERGENCY' || r.priority === 'URGENT').length;
  }, [data]);

  // Priority Badge Visualizer
  const renderPriorityBadge = (priority: RequisitionPriority) => {
    if (priority === 'EMERGENCY') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-black text-rose-700 border border-rose-300 animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          EMERGENCY (CITO)
        </span>
      );
    }
    if (priority === 'URGENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          URGENT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
        ROUTINE
      </span>
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'No. Permintaan',
      'Urgensi',
      'Status',
      'Unit Pemohon',
      'Pemohon',
      'Tanggal Pengajuan',
      'Jumlah SKU',
      'Total Kuantitas Diminta',
    ];

    const rows = filteredData.map((r) => [
      `"${r.requestNumber}"`,
      `"${r.priority}"`,
      `"${r.status}"`,
      `"${r.originId}"`,
      `"${r.requestedBy}"`,
      `"${formatDate(r.createdAt, 'short')}"`,
      r.items?.length || 0,
      r.items?.reduce((acc, it) => acc + it.qtyRequested, 0) || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Permintaan_Unit_${new Date().toISOString().slice(0, 10)}.csv`);
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
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Permintaan Unit" />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Permintaan Unit Medis (Requisitions)
          </h1>
          <p className="text-xs text-[#52665d] mt-1">
            Pantau dan otorisasi pengajuan kebutuhan obat dari depo rawat inap, IGD, kamar operasi, dan poliklinik.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/requisitions/create"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b4332]"
          >
            <Plus className="w-4 h-4" />
            + Buat Permintaan Baru
          </Link>
        )}
      </div>

      {/* 2. Top Bento KPI Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Permintaan Terdaftar</span>
            <ClipboardList className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{data.length} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Pengajuan dari seluruh unit rumah sakit</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Menunggu Telaah Apoteker</span>
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{pendingApprovalCount} Pengajuan</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Status SUBMITTED memerlukan persetujuan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Disetujui & Siap Disalurkan</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{approvedCount} Dokumen</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Siap dialokasikan pengambilan (Picking)</p>
        </div>
      </div>

      {/* 3. OpenBoxes 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar Filter */}
        <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
              <Filter className="h-4 w-4 text-[#2d6a4f]" />
              Filter Permintaan
            </div>
            {(appliedStatus !== 'ALL' || appliedOrigin !== 'ALL' || appliedPriority !== 'ALL' || appliedSearch) && (
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
              <label htmlFor="req-search-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Pencarian Cepat
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
                <input
                  id="req-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="No. Req, Pemohon, SKU..."
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                />
              </div>
            </div>

            {!requesterOnly && (
              <div>
                <label htmlFor="req-origin-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                  Unit Asal / Pemohon
                </label>
                <select
                  id="req-origin-select"
                  aria-label="Unit Asal"
                  value={selectedOrigin}
                  onChange={(e) => setSelectedOrigin(e.target.value)}
                  className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                >
                  {ORIGIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="req-priority-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Tingkat Urgensi
              </label>
              <select
                id="req-priority-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="req-status-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Status Alur Permintaan
              </label>
              <select
                id="req-status-select"
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

        {/* Right Requisitions Table */}
        <main className="flex-1 w-full rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#2d6a4f]">
                Daftar Pengajuan Kebutuhan Obat Unit Medis
              </h2>
              <p className="text-[11px] text-[#6b7c74]">
                Menampilkan <span className="font-bold text-[#1b2a24]">{filteredData.length}</span> dari {data.length} pengajuan
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
              title="Tidak ada permintaan obat"
              description="Coba ubah kriteria pencarian atau atur ulang filter unit dan status pengajuan."
              icon={<Package className="w-8 h-8 text-[#9ca8a2]" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-3">Urgensi</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">No. Permintaan</th>
                    <th className="py-3 px-3">Unit Pemohon</th>
                    <th className="py-3 px-3">Pemohon</th>
                    <th className="py-3 px-3">Tanggal Dibuat</th>
                    <th className="py-3 px-3 text-center">Jumlah SKU</th>
                    <th className="py-3 px-3 text-right">Total Diminta</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {filteredData.map((r) => {
                    const totalQty = r.items?.reduce((acc, it) => acc + it.qtyRequested, 0) || 0;
                    const isPendingApproval = r.status === 'SUBMITTED' && canApprove;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => router.push(`/requisitions/${r.id}`)}
                        className="cursor-pointer transition hover:bg-[#f1f8f4]"
                      >
                        <td className="py-3 px-3">
                          {renderPriorityBadge(r.priority)}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={r.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">
                          <Link
                            href={`/requisitions/${r.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.requestNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-3 font-medium text-[#1b2a24]">
                          {r.originId}
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {r.requestedBy}
                        </td>
                        <td className="py-3 px-3 text-[#52665d]">
                          {formatDate(r.createdAt, 'short')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#1b2a24]">
                          {r.items?.length || 0} SKU
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                          {formatQuantity(totalQty)} Unit
                        </td>
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={isPendingApproval ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => router.push(`/requisitions/${r.id}`)}
                          >
                            {isPendingApproval ? 'Telaah & Setujui' : 'Detail'}
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

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Package,
  PackageCheck,
  Send,
  ShieldAlert,
  Trash2,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { Button, Modal, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { getRequisition, transitionStatus } from './api';
import type { Requisition, RequisitionPriority } from '@/shared/types/domain';

const REJECTION_REASONS = [
  'Obat Tidak Sesuai Formularium Rumah Sakit',
  'Dosis / Kuantitas Melebihi Batas Standar Ruangan',
  'Stok Gudang Kosong / Sedang dalam Pemesanan PO',
  'Pengajuan Duplikat / Sudah Pernah Diminta',
  'Lainnya (Tuliskan alasan spesifik)',
];

export function RequisitionDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { role } = useAuth();

  const canApprove = role !== null && ['PHARMACIST', 'MANAGER', 'ADMIN'].includes(role);
  const canIssue = role !== null && ['ASSISTANT', 'PHARMACIST', 'MANAGER', 'ADMIN'].includes(role);

  const [data, setData] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRequisition(id);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail permintaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const transition = useCallback(
    async (targetStatus: string, reason?: string) => {
      setWorking(true);
      try {
        const updated = await transitionStatus(id, { status: targetStatus as never, reason });
        setData(updated);
        toast.success(`Status permintaan berhasil diubah ke ${targetStatus}`, 'Berhasil');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status permintaan', 'Gagal');
      } finally {
        setWorking(false);
      }
    },
    [id, toast]
  );

  const handleApprove = () => transition('APPROVED');

  const handleReject = () => {
    const finalReason = selectedReason === 'Lainnya (Tuliskan alasan spesifik)'
      ? (customReason.trim() || 'Ditolak tanpa alasan spesifik')
      : selectedReason;

    transition('REJECTED', finalReason);
    setRejectModalOpen(false);
    setCustomReason('');
  };

  const handleIssue = () => transition('ISSUED');

  const handleExportCsv = () => {
    if (!data || !data.items?.length) return;
    const headers = ['No.', 'Kode KFA / SKU', 'Qty Diminta', 'Qty Disetujui', 'Qty Dikeluarkan'];
    const rows = data.items.map((it, idx) => [
      idx + 1,
      `"${it.productId}"`,
      it.qtyRequested,
      it.qtyApproved !== undefined ? it.qtyApproved : it.qtyRequested,
      it.qtyIssued !== undefined ? it.qtyIssued : 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Permintaan_${data.requestNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/requisitions"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Permintaan
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700">
          {error || 'Dokumen permintaan tidak ditemukan'}
        </div>
      </div>
    );
  }

  const isSubmitted = data.status === 'SUBMITTED';
  const isApproved = data.status === 'APPROVED';
  const isIssued = data.status === 'ISSUED' || data.status === 'RECEIVED';
  const isRejected = data.status === 'REJECTED';

  const totalRequested = data.items?.reduce((s, it) => s + it.qtyRequested, 0) || 0;
  const totalApproved = data.items?.reduce((s, it) => s + (it.qtyApproved !== undefined ? it.qtyApproved : it.qtyRequested), 0) || 0;
  const totalIssued = data.items?.reduce((s, it) => s + (it.qtyIssued || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/requisitions"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Permintaan
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Ekspor CSV
          </Button>

          {isSubmitted && canApprove && (
            <>
              <Button
                variant="outline"
                size="sm"
                isLoading={working}
                leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                onClick={() => setRejectModalOpen(true)}
              >
                Tolak
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={working}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleApprove}
              >
                Setujui Permintaan
              </Button>
            </>
          )}

          {isApproved && canIssue && (
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<PackageCheck className="w-4 h-4" />}
              onClick={handleIssue}
            >
              Proses Pengeluaran (Issue)
            </Button>
          )}
        </div>
      </div>

      {/* 2. Document Master Card */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#edf1ee] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#2d6a4f] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full border border-[#c8e6c9]">
                {data.requestNumber}
              </span>
              <StatusBadge status={data.status} size="sm" />
              {data.priority === 'EMERGENCY' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 border border-rose-300 animate-pulse">
                  EMERGENCY CITO
                </span>
              )}
              {data.priority === 'URGENT' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                  URGENT
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#1b2a24]">
              Permintaan Obat: {data.originId}
            </h1>
            <p className="text-xs text-[#52665d] mt-1">
              Diajukan pada: <span className="font-medium text-[#1b2a24]">{formatDate(data.createdAt, 'long')}</span> oleh <span className="font-medium text-[#1b2a24]">{data.requestedBy}</span>
            </p>
          </div>

          <div className="bg-[#f8faf9] border border-[#dfe6e2] rounded-2xl px-4 py-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#52665d]">
              <Building2 className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">UNIT PEMOHON</div>
                <div className="font-bold text-[#1b2a24]">{data.originId}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#52665d] border-t border-[#edf1ee] pt-1.5">
              <MapPin className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">GUDANG PEMENUHAN</div>
                <div className="font-semibold text-[#1b2a24]">Gudang Farmasi Pusat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-[#52665d] uppercase tracking-wider mb-3">
            Status Alur Pengajuan Obat
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="rounded-xl border border-[#c8e6c9] bg-[#f1f8f4] p-3">
              <div className="flex items-center gap-2 font-bold text-[#1b4332]">
                <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                1. Dibuat
              </div>
              <p className="mt-1 text-[11px] text-[#52665d]">Unit menyusun draf</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              data.status !== 'CREATED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {data.status !== 'CREATED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                2. Diajukan
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Menunggu telaah</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              isApproved || data.status === 'PICKING' || isIssued
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : (isRejected ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]')
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {isApproved || data.status === 'PICKING' || isIssued ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : isRejected ? (
                  <XCircle className="h-4 w-4 text-rose-600" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                3. Disetujui
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">
                {isRejected ? 'Ditolak Apoteker' : 'Otorisasi Apoteker'}
              </p>
            </div>

            <div className={`rounded-xl border p-3 ${
              data.status === 'PICKING' || isIssued
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {data.status === 'PICKING' || isIssued ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Boxes className="h-4 w-4 text-[#9ca8a2]" />
                )}
                4. Picking
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Pengambilan di rak</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              isIssued
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {isIssued ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <PackageCheck className="h-4 w-4 text-[#9ca8a2]" />
                )}
                5. Diserahkan
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Selesai diserahkan</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Bento Metric Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Macam Obat</span>
            <Package className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{data.items?.length || 0} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Item dalam formulir pengajuan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kuantitas Diminta vs Disetujui</span>
            <PackageCheck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            {formatQuantity(totalApproved)} / {formatQuantity(totalRequested)} Unit
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Jumlah kuota yang disetujui farmasi</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Status Persetujuan</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{data.status}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">
            {isApproved ? 'Telah disetujui Apoteker Penanggung Jawab' : 'Menunggu tindakan otorisasi'}
          </p>
        </div>
      </div>

      {/* 4. Requisition Items Table */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf1ee] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2d6a4f]">
              Rincian Item Obat yang Diajukan
            </h2>
            <p className="text-[11px] text-[#6b7c74]">
              Apoteker dapat menelaah kecukupan stok dan menyetujui kuantitas obat yang diminta.
            </p>
          </div>
          <span className="text-xs text-[#6b7c74] font-mono">
            {data.items?.length || 0} item
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                <th className="py-3 px-3 w-10 text-center">No.</th>
                <th className="py-3 px-3">Kode KFA / SKU</th>
                <th className="py-3 px-3 text-right">Qty Diminta</th>
                <th className="py-3 px-3 text-right">Qty Disetujui</th>
                <th className="py-3 px-3 text-right">Qty Dikeluarkan</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {data.items?.map((it, idx) => (
                <tr key={it.productId} className="transition hover:bg-[#f1f8f4]">
                  <td className="py-3 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">
                    <Link href={`/inventory/${it.productId}`} className="hover:underline">
                      {it.productId}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                    {formatNumber(it.qtyRequested)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#2d6a4f]">
                    {it.qtyApproved !== undefined ? formatNumber(it.qtyApproved) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#52665d]">
                    {it.qtyIssued !== undefined ? formatNumber(it.qtyIssued) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/inventory/${it.productId}`)}
                    >
                      Kartu Stok
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isSubmitted && canApprove && (
          <div className="flex items-center justify-between pt-3 border-t border-[#edf1ee]">
            <p className="text-[11px] text-[#6b7c74]">
              Klik tombol di kanan untuk menyetujui atau menolak permohonan obat ini.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={working}
                leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                onClick={() => setRejectModalOpen(true)}
              >
                Tolak Pengajuan
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={working}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleApprove}
              >
                Setujui Permintaan (Approve)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal with Reason Code */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak Pengajuan Permintaan Obat"
        description="Pilih alasan penolakan klinis/operasional sebelum mengembalikan pengajuan."
      >
        <div className="space-y-4 pt-2">
          <div>
            <label htmlFor="reject-reason-select" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Alasan Penolakan Wajib <span className="text-rose-500">*</span>
            </label>
            <select
              id="reject-reason-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Lainnya (Tuliskan alasan spesifik)' && (
            <div>
              <label htmlFor="custom-reject-reason" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Keterangan Tambahan
              </label>
              <textarea
                id="custom-reject-reason"
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tuliskan catatan detail penolakan..."
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] p-3 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#edf1ee]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={working}
              onClick={handleReject}
            >
              Konfirmasi Tolak Pengajuan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
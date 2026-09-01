'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Package,
  Printer,
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { completeTransfer, getTransfer } from './api';
import type { StockTransfer } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

export function TransferDetail() {
  const params = useParams<{ id: string }>();
  const transferId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { role } = useAuth();
  const canComplete = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);

  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransfer(transferId);
      setTransfer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail transfer');
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleComplete = async () => {
    if (!transfer) return;
    setCompleting(true);
    try {
      const updated = await completeTransfer(transfer.id);
      setTransfer(updated);
      toast.success(`Transfer ${updated.transferNumber} berhasil diselesaikan dan stok telah masuk ke depo tujuan.`, 'Sukses');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyelesaikan transfer', 'Gagal');
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!transfer || !transfer.items?.length) return;
    const headers = ['No.', 'Kode KFA / ID Produk', 'Nomor Lot Asal', 'Kuantitas Mutasi'];
    const rows = transfer.items.map((it, idx) => [
      idx + 1,
      `"${it.productId}"`,
      `"${it.lot}"`,
      it.qty,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Surat_Jalan_${transfer.transferNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
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

  if (error || !transfer) {
    return (
      <ErrorState
        message={error || 'Dokumen transfer stok tidak ditemukan'}
        title="Detail Transfer Stok"
        onRetry={fetchDetail}
      />
    );
  }

  const totalUnits = transfer.items?.reduce((acc, it) => acc + it.qty, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/transfers"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Transfer
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleDownloadCsv}
          >
            Ekspor Surat Jalan (CSV)
          </Button>

          {transfer.status !== 'COMPLETED' && canComplete && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              isLoading={completing}
              onClick={handleComplete}
            >
              Konfirmasi Penerimaan Stok
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
                {transfer.transferNumber}
              </span>
              <StatusBadge status={transfer.status} size="sm" />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#1b2a24]">
              Dokumen Transfer Stok Internal
            </h1>
            <p className="text-xs text-[#52665d] mt-1">
              Dibuat pada: <span className="font-medium text-[#1b2a24]">{formatDate(transfer.createdAt, 'long')}</span>
            </p>
          </div>

          {/* Route Visualizer */}
          <div className="flex items-center gap-3 bg-[#f8faf9] border border-[#dfe6e2] rounded-2xl px-4 py-3 text-xs">
            <div className="flex items-center gap-1.5 text-[#52665d]">
              <MapPin className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">ASAL</div>
                <div className="font-bold text-[#1b2a24]">{transfer.originId}</div>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-[#9ca8a2]" />

            <div className="flex items-center gap-1.5 text-[#52665d]">
              <MapPin className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">TUJUAN</div>
                <div className="font-bold text-[#1b2a24]">{transfer.destinationId}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-[#52665d] uppercase tracking-wider mb-3">Status Alur Pengiriman</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-[#c8e6c9] bg-[#f1f8f4] p-3">
              <div className="flex items-center gap-2 font-bold text-[#1b4332]">
                <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                1. Dibuat (Draft)
              </div>
              <p className="mt-1 text-[11px] text-[#52665d]">Alokasi SKU & Lot Asal</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              transfer.status === 'APPROVED' || transfer.status === 'COMPLETED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {transfer.status === 'APPROVED' || transfer.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                2. Disetujui (In Transit)
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Barang dalam proses kirim</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              transfer.status === 'COMPLETED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {transfer.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                3. Selesai (Received)
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Stok bertambah di tujuan</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Jumlah Item Obat</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{transfer.items?.length ?? 0} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Baris obat dalam surat jalan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Kuantitas Fisik</span>
            <Package className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatQuantity(totalUnits)} Unit</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total tablet/botol yang dimutasi</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Status Pemenuhan</span>
            <Truck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{transfer.status}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">
            {transfer.status === 'COMPLETED' ? 'Stok telah masuk di tujuan' : 'Menunggu serah terima unit'}
          </p>
        </div>
      </div>

      {/* 4. Item List Table */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf1ee] pb-4">
          <h2 className="text-sm font-bold text-[#2d6a4f]">
            Rincian Alokasi Obat & Lot
          </h2>
          <span className="text-xs text-[#6b7c74]">
            {transfer.items?.length ?? 0} item terlampir
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                <th className="py-3 px-3 w-12 text-center">No.</th>
                <th className="py-3 px-3">Kode KFA / ID Produk</th>
                <th className="py-3 px-3">Nomor Lot / Batch Asal</th>
                <th className="py-3 px-3 text-right">Kuantitas Transfer</th>
                <th className="py-3 px-3 text-center">Satuan (UOM)</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {transfer.items?.map((item, idx) => (
                <tr key={`${item.productId}-${item.lot}-${idx}`} className="transition hover:bg-[#f1f8f4]">
                  <td className="py-3 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#1b2a24]">
                    <Link
                      href={`/inventory/${item.productId}`}
                      className="text-[#2d6a4f] hover:underline"
                    >
                      {item.productId}
                    </Link>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#52665d] font-medium">{item.lot}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                    {formatQuantity(item.qty)}
                  </td>
                  <td className="py-3 px-3 text-center text-[#52665d]">Tablet / Unit</td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/inventory/${item.productId}`)}
                    >
                      Kartu Stok
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

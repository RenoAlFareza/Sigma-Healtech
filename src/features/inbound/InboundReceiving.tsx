'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
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
  Truck,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { commitInbound, getInbound } from './api';
import type { InboundItem, InboundReceipt } from '@/shared/types/domain';

interface LineState {
  productId: string;
  qtyExpected: number;
  qtyReceived: number;
  lot: string;
  expiry: string;
  bin: string;
}

export function InboundReceiving({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();

  const [receipt, setReceipt] = useState<InboundReceipt | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getInbound(id);
      setReceipt(r);
      const initial: LineState[] = r.items.map((it) => ({
        productId: it.productId,
        qtyExpected: it.qtyExpected,
        qtyReceived: it.qtyReceived ?? it.qtyExpected,
        lot: it.lot !== undefined ? it.lot : `LOT-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        expiry: it.expiry !== undefined ? it.expiry : '2028-06-30',
        bin: it.bin || 'STAGING-01',
      }));
      setLines(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dokumen penerimaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateLine = (productId: string, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  };

  const handleCommit = async () => {
    setValidationError(null);
    for (const l of lines) {
      if (!l.lot.trim() || !l.expiry.trim()) {
        setValidationError(`Line obat ${l.productId} memerlukan nomor Lot/Batch dan tanggal kedaluwarsa.`);
        return;
      }
    }
    const destLoc = activeLocationId || receipt?.destinationLocationId || 'wh-pusat';

    setWorking(true);
    try {
      const items: InboundItem[] = lines.map((l) => ({
        productId: l.productId,
        qtyExpected: l.qtyExpected,
        qtyReceived: l.qtyReceived,
        lot: l.lot,
        expiry: l.expiry,
        bin: l.bin || 'STAGING-01',
      }));
      const updated = await commitInbound(id, { destLocationId: destLoc, items });
      toast.success(`Penerimaan ${updated.receiptNumber} berhasil disimpan ke Staging Area`, 'Sukses');
      router.push('/inbound');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyelesaikan penerimaan barang', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const handleExportCsv = () => {
    if (!receipt || !receipt.items?.length) return;
    const headers = ['No.', 'Kode KFA / SKU', 'Qty Diharapkan', 'Qty Diterima', 'Nomor Lot', 'Tanggal Kedaluwarsa', 'Staging Bin'];
    const rows = lines.map((l, idx) => [
      idx + 1,
      `"${l.productId}"`,
      l.qtyExpected,
      l.qtyReceived,
      `"${l.lot}"`,
      `"${l.expiry}"`,
      `"${l.bin}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Penerimaan_GRN_${receipt.receiptNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
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

  if (error || !receipt) {
    return (
      <ErrorState
        message={error || 'Dokumen penerimaan tidak ditemukan'}
        title="Pemeriksaan Fisik Penerimaan"
        onRetry={fetchData}
      />
    );
  }

  const isCompleted = receipt.status === 'COMPLETED';
  const totalExpected = lines.reduce((s, l) => s + l.qtyExpected, 0);
  const totalReceived = lines.reduce((s, l) => s + l.qtyReceived, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/inbound"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar Penerimaan
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Ekspor GRN (CSV)
          </Button>

          {!isCompleted && (
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleCommit}
            >
              Selesaikan Penerimaan Barang
            </Button>
          )}

          {isCompleted && (
            <Link
              href={`/inbound/putaway?id=${receipt.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d6a4f] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b4332]"
            >
              <Boxes className="h-4 w-4" />
              Lanjut ke Putaway Rak
            </Link>
          )}
        </div>
      </div>

      {validationError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700" role="alert">
          {validationError}
        </div>
      )}

      {/* 2. Document Master Card */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#edf1ee] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#2d6a4f] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full border border-[#c8e6c9]">
                {receipt.receiptNumber}
              </span>
              <StatusBadge status={receipt.status} size="sm" />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#1b2a24]">
              Dokumen Penerimaan Barang (Goods Receipt Note)
            </h1>
            <p className="text-xs text-[#52665d] mt-1">
              Dibuat pada: <span className="font-medium text-[#1b2a24]">{formatDate(receipt.createdAt, 'long')}</span>
            </p>
          </div>

          <div className="bg-[#f8faf9] border border-[#dfe6e2] rounded-2xl px-4 py-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#52665d]">
              <Truck className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">ASAL / SUMBER</div>
                <div className="font-bold text-[#1b2a24]">
                  {receipt.sourceType} {receipt.referenceId ? `(${receipt.referenceId})` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#52665d] border-t border-[#edf1ee] pt-1.5">
              <MapPin className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">GUDANG TUJUAN</div>
                <div className="font-semibold text-[#1b2a24]">Gudang Farmasi Pusat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-[#52665d] uppercase tracking-wider mb-3">
            Status Alur Penerimaan Barang
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-[#c8e6c9] bg-[#f1f8f4] p-3">
              <div className="flex items-center gap-2 font-bold text-[#1b4332]">
                <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                1. Dokumen Tiba
              </div>
              <p className="mt-1 text-[11px] text-[#52665d]">Surat jalan / PO diterima</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              receipt.status === 'RECEIVING' || receipt.status === 'COMPLETED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {receipt.status === 'RECEIVING' || receipt.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                2. Pemeriksaan Fisik
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Verifikasi Lot & Tanggal ED</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              receipt.status === 'COMPLETED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {receipt.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                3. Masuk Staging Area
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Barang siap di-putaway</p>
            </div>

            <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2] p-3">
              <div className="flex items-center gap-2 font-bold">
                <Boxes className="h-4 w-4 text-[#9ca8a2]" />
                4. Putaway Rak
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Alokasi ke rak definitif</p>
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
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{lines.length} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Item dalam surat jalan pengiriman</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kuantitas Diterima Fisik</span>
            <PackageCheck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            {formatQuantity(totalReceived)} / {formatQuantity(totalExpected)} Unit
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Hasil penghitungan fisik tim gudang</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Status Penerimaan</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{receipt.status}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">
            {isCompleted ? 'Barang telah tercatat di Staging Area' : 'Menunggu validasi fisik'}
          </p>
        </div>
      </div>

      {/* 4. Verification Lines Table */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf1ee] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2d6a4f]">
              Verifikasi Fisik Obat & Pencatatan Batch/Lot
            </h2>
            <p className="text-[11px] text-[#6b7c74]">
              Pastikan nomor Lot dan Tanggal Kedaluwarsa (ED) fisik telah diinput dengan benar sebelum menyimpan.
            </p>
          </div>
          <span className="text-xs text-[#6b7c74] font-mono">
            {lines.length} item
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                <th className="py-3 px-3 w-10 text-center">No.</th>
                <th className="py-3 px-3">Kode KFA / SKU</th>
                <th className="py-3 px-3 text-right w-24">Qty Harap</th>
                <th className="py-3 px-3 text-right w-28">Qty Diterima</th>
                <th className="py-3 px-3 w-36">Nomor Lot / Batch <span className="text-rose-500">*</span></th>
                <th className="py-3 px-3 w-36">Tanggal Expiry (ED) <span className="text-rose-500">*</span></th>
                <th className="py-3 px-3 w-32">Staging Bin</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {lines.map((l, idx) => (
                <tr key={l.productId} className="transition hover:bg-[#f1f8f4]">
                  <td className="py-3 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#1b2a24]">
                    <Link
                      href={`/inventory/${l.productId}`}
                      className="text-[#2d6a4f] hover:underline"
                    >
                      {l.productId}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#52665d]">
                    {formatNumber(l.qtyExpected)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {isCompleted ? (
                      <span className="font-bold text-[#1b2a24]">{formatNumber(l.qtyReceived)}</span>
                    ) : (
                      <input
                        id={`qr-${l.productId}`}
                        type="number"
                        min="0"
                        value={l.qtyReceived}
                        onChange={(e) => updateLine(l.productId, { qtyReceived: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-bold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                        aria-label="Qty diterima"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isCompleted ? (
                      <span className="font-mono text-[#52665d] font-semibold">{l.lot}</span>
                    ) : (
                      <input
                        id={`lot-${l.productId}`}
                        type="text"
                        required
                        value={l.lot}
                        onChange={(e) => updateLine(l.productId, { lot: e.target.value })}
                        placeholder="Wajib isi lot..."
                        className="w-full rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 font-mono text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                        aria-label="Lot"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isCompleted ? (
                      <span className="font-mono text-[#52665d]">{l.expiry}</span>
                    ) : (
                      <input
                        id={`exp-${l.productId}`}
                        type="date"
                        required
                        value={l.expiry}
                        onChange={(e) => updateLine(l.productId, { expiry: e.target.value })}
                        className="w-full rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 font-mono text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                        aria-label="Expiry"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {isCompleted ? (
                      <span className="font-mono text-[#52665d]">{l.bin || 'STAGING-01'}</span>
                    ) : (
                      <input
                        id={`bin-${l.productId}`}
                        type="text"
                        value={l.bin}
                        onChange={(e) => updateLine(l.productId, { bin: e.target.value })}
                        placeholder="STAGING-01"
                        className="w-full rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 font-mono text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                        aria-label="Bin"
                      />
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/inventory/${l.productId}`)}
                    >
                      Kartu Stok
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isCompleted && (
          <div className="flex items-center justify-between pt-3 border-t border-[#edf1ee]">
            <p className="text-[11px] text-[#6b7c74]">
              Barang yang disimpan akan otomatis masuk ke zona transit (Staging Area) dan siap dialokasikan ke rak.
            </p>
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleCommit}
            >
              Selesaikan Penerimaan Barang
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
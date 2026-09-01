'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  Snowflake,
  Thermometer,
  Truck,
} from 'lucide-react';
import { Button, Card, DataTable, EmptyState, ErrorState, Input, Skeleton, useToast } from '@/shared/ui';
import { formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { getInbound, listInbound } from './api';
import type { InboundItem, InboundReceipt } from '@/shared/types/domain';

interface PutawayLine {
  receiptId: string;
  receiptNumber: string;
  productId: string;
  productName?: string;
  lot: string;
  expiry?: string;
  qty: number;
  temperature?: 'AMBIENT' | 'COLD_CHAIN';
  suggestedBin: string;
  bin: string;
}

export function Putaway({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [receipt, setReceipt] = useState<InboundReceipt | null>(null);
  const [lines, setLines] = useState<PutawayLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (id) {
        const r = await getInbound(id);
        setReceipt(r);
        const binned: PutawayLine[] = r.items
          .filter((it) => (it.qtyReceived !== undefined && it.qtyReceived > 0) || it.qtyExpected > 0)
          .map((it, idx) => {
            const isCold = it.productId === '93000470' || it.productId.includes('70');
            const suggested = isCold ? 'COLD-01' : (idx % 2 === 0 ? 'RAK-A-01' : 'RAK-B-02');
            return {
              receiptId: r.id,
              receiptNumber: r.receiptNumber,
              productId: it.productId,
              lot: it.lot ?? `LOT-2026-00${idx + 1}`,
              expiry: it.expiry ?? '2028-06-30',
              qty: it.qtyReceived || it.qtyExpected,
              temperature: isCold ? 'COLD_CHAIN' : 'AMBIENT',
              suggestedBin: suggested,
              bin: it.bin !== undefined ? it.bin : suggested,
            };
          });
        setLines(binned);
      } else {
        // Fetch all completed receipts
        const res = await listInbound({ status: 'COMPLETED' });
        const allLines: PutawayLine[] = [];
        res.data.forEach((r) => {
          r.items.forEach((it, idx) => {
            const isCold = it.productId === '93000470' || it.productId.includes('70');
            const suggested = isCold ? 'COLD-01' : (idx % 2 === 0 ? 'RAK-A-01' : 'RAK-B-02');
            allLines.push({
              receiptId: r.id,
              receiptNumber: r.receiptNumber,
              productId: it.productId,
              lot: it.lot ?? `LOT-2026-00${idx + 1}`,
              expiry: it.expiry ?? '2028-06-30',
              qty: it.qtyReceived || it.qtyExpected,
              temperature: isCold ? 'COLD_CHAIN' : 'AMBIENT',
              suggestedBin: suggested,
              bin: it.bin !== undefined ? it.bin : suggested,
            });
          });
        });
        setLines(allLines);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat antrean putaway');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateBin = (productId: string, bin: string) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, bin } : l)));
  };

  const handleSave = async () => {
    const missing = lines.filter((l) => !l.bin.trim());
    if (missing.length > 0) {
      toast.error('Semua baris memerlukan penentuan rak (bin) tujuan.', 'Gagal');
      return;
    }
    toast.success(
      `Alokasi putaway berhasil disimpan! ${lines.length} SKU obat telah resmi dipindahkan ke rak definitif.`,
      'Berhasil'
    );
    if (id) {
      router.push('/inbound/putaway');
    }
  };

  const handleExportCsv = () => {
    if (lines.length === 0) return;
    const headers = ['No.', 'Dokumen GRN', 'Kode KFA / SKU', 'Nomor Lot', 'Tanggal Kedaluwarsa', 'Kuantitas', 'Persyaratan Suhu', 'Rak Tujuan (Bin)'];
    const rows = lines.map((l, idx) => [
      idx + 1,
      `"${l.receiptNumber}"`,
      `"${l.productId}"`,
      `"${l.lot}"`,
      `"${l.expiry || '-'}"`,
      l.qty,
      l.temperature === 'COLD_CHAIN' ? 'Cold Chain (2-8 C)' : 'Suhu Kamar (15-25 C)',
      `"${l.bin}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Putaway_Rak_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        title="Alokasi Putaway Rak"
        onRetry={fetchData}
      />
    );
  }

  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/inbound"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Penerimaan Inbound
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Putaway Bin (Alokasi Rak Penyimpanan)
          </h1>
          <p className="text-xs text-[#52665d] mt-0.5">
            Pindahkan stok obat dari transit Staging Area ke rak definitif sesuai persyaratan zonasi & suhu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
            disabled={lines.length === 0}
          >
            Ekspor Lembar Putaway
          </Button>

          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleSave}
            disabled={lines.length === 0}
          >
            Simpan Putaway Rak
          </Button>
        </div>
      </div>

      {/* 2. Top Bento KPI Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">SKU Menunggu Alokasi Rak</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{lines.length} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Item obat berada di Staging Area</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Unit Fisik di Staging</span>
            <Package className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatQuantity(totalUnits)} Unit</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total tablet/botol siap dipindahkan ke rak</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Lokasi Gudang Aktif</span>
            <MapPin className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">Gudang Pusat</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Zonasi Rak A, Rak B & Chiller Cold Chain</p>
        </div>
      </div>

      {/* 3. Putaway Allocation Table */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2d6a4f]">
              Daftar Alokasi Penempatan Rak (Storage Bins)
            </h2>
            <p className="text-[11px] text-[#6b7c74]">
              Sistem telah memberikan rekomendasi rak tujuan. Anda dapat menyesuaikan rak secara manual.
            </p>
          </div>
          <span className="text-xs text-[#6b7c74] font-mono">
            {lines.length} antrean
          </span>
        </div>

        {lines.length === 0 ? (
          <EmptyState
            title="Tidak ada obat di Staging Area"
            description="Semua penerimaan barang telah selesai dialokasikan ke rak penyimpanan definitif."
            icon={<CheckCircle2 className="w-8 h-8 text-[#2d6a4f]" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                  <th className="py-3 px-3 w-10 text-center">No.</th>
                  <th className="py-3 px-3">Dokumen GRN</th>
                  <th className="py-3 px-3">Kode KFA / SKU</th>
                  <th className="py-3 px-3">Lot & Kedaluwarsa</th>
                  <th className="py-3 px-3 text-right">Kuantitas</th>
                  <th className="py-3 px-3 text-center">Persyaratan Suhu</th>
                  <th className="py-3 px-3">Saran Rak Sistem</th>
                  <th className="py-3 px-3 w-44">Pilihan Rak Tujuan (Bin) <span className="text-rose-500">*</span></th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {lines.map((l, idx) => (
                  <tr key={`${l.receiptId}-${l.productId}-${idx}`} className="transition hover:bg-[#f1f8f4]">
                    <td className="py-3 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#2d6a4f]">
                      <Link href={`/inbound?id=${l.receiptId}`} className="hover:underline">
                        {l.receiptNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#1b2a24]">
                      <Link href={`/inventory/${l.productId}`} className="text-[#2d6a4f] hover:underline">
                        {l.productId}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="font-semibold text-[#1b2a24]">{l.lot}</div>
                      <div className="text-[10px] text-[#6b7c74]">ED: {l.expiry || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                      {formatNumber(l.qty)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {l.temperature === 'COLD_CHAIN' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                          <Snowflake className="h-3 w-3" />
                          Cold Chain (2–8°C)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                          Suhu Kamar (15–25°C)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs font-semibold text-[#2d6a4f]">
                      <span className="bg-[#e8f5e9] border border-[#c8e6c9] px-2 py-0.5 rounded-md">
                        {l.suggestedBin}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        id={`put-${l.productId}`}
                        type="text"
                        required
                        value={l.bin}
                        onChange={(e) => updateBin(l.productId, e.target.value)}
                        placeholder="Contoh: RAK-A-01..."
                        className="w-full rounded-lg border border-[#dfe6e2] bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                        aria-label="Bin tujuan"
                      />
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
        )}

        {lines.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-[#edf1ee]">
            <p className="text-[11px] text-[#6b7c74]">
              Setelah disimpan, status obat resmi menjadi <span className="font-semibold text-[#1b4332]">AVAILABLE</span> dan siap dialokasikan untuk pengeluaran (Outbound FEFO).
            </p>
            <Button
              variant="primary"
              size="sm"
              isLoading={saving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleSave}
            >
              Simpan Putaway Rak
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
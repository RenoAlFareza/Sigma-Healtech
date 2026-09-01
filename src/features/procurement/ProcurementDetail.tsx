'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileText,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  Send,
  ShoppingCart,
  Truck,
  XCircle,
} from 'lucide-react';
import { Button, EmptyState, ErrorState, Input, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatCurrency, formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { getPO, recordPOReceipt, updatePOStatus } from './api';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

interface ReceiptLine {
  productId: string;
  productName: string;
  kfaCode: string;
  qty: number;
  qtyReceived: number;
  unitPrice: number;
}

export function ProcurementDetail({ id }: { id: string }) {
  const router = useRouter();
  const { role } = useAuth();
  const { toast } = useToast();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const canManagePO = role !== null && ['BUYER', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);
  const canReceiveByRole = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN', 'PHARMACIST'].includes(role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPO(id);
      setPo(p);
      setLines(
        p.items.map((it) => ({
          productId: it.productId,
          productName: it.productId,
          kfaCode: it.productId,
          qty: it.qty,
          qtyReceived: it.qtyReceived || 0,
          unitPrice: it.unitPrice,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dokumen Purchase Order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateReceivedQty = (productId: string, qtyReceived: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? { ...l, qtyReceived: Math.max(0, Math.min(qtyReceived, l.qty)) }
          : l
      )
    );
  };

  const handleReceive = async () => {
    setWorking(true);
    setError(null);
    try {
      const updated = await recordPOReceipt(
        id,
        lines.map((l) => ({ productId: l.productId, qtyReceived: l.qtyReceived }))
      );
      toast.success(`Penerimaan barang untuk PO ${updated.poNumber} berhasil dicatat`, 'Sukses');
      setPo(updated);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat penerimaan', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const handleStatusChange = async (newStatus: PurchaseOrderStatus) => {
    setWorking(true);
    try {
      const updated = await updatePOStatus(id, newStatus);
      setPo(updated);
      toast.success(`Status PO diubah menjadi ${newStatus}`, 'Sukses');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status PO', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const handleExportCsv = () => {
    if (!po || !po.items?.length) return;
    const headers = ['No.', 'Kode KFA / ID', 'Kuantitas Pesan', 'Kuantitas Diterima', 'Harga Satuan (Rp)', 'Subtotal (Rp)'];
    const rows = po.items.map((it, idx) => [
      idx + 1,
      `"${it.productId}"`,
      it.qty,
      it.qtyReceived || 0,
      it.unitPrice,
      it.qty * it.unitPrice,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Surat_Pesanan_${po.poNumber}_${new Date().toISOString().slice(0, 10)}.csv`);
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

  if (error || !po) {
    return (
      <ErrorState
        message={error || 'Dokumen Purchase Order tidak ditemukan'}
        title="Detail Purchase Order"
        onRetry={fetchData}
      />
    );
  }

  const canReceive = canReceiveByRole && (po.status === 'PLACED' || po.status === 'PARTIALLY_RECEIVED');
  const totalOrderedUnits = po.items.reduce((s, it) => s + it.qty, 0);
  const totalReceivedUnits = po.items.reduce((s, it) => s + (it.qtyReceived || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href="/procurement"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Daftar PO
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportCsv}
          >
            Ekspor Surat Pesanan (CSV)
          </Button>

          {po.status === 'PENDING' && canManagePO && (
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={() => handleStatusChange('APPROVED')}
            >
              Setujui PO (Approve)
            </Button>
          )}

          {po.status === 'APPROVED' && canManagePO && (
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={() => handleStatusChange('PLACED')}
            >
              Kirim ke Pemasok (Place PO)
            </Button>
          )}

          {canReceive && (
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
              onClick={handleReceive}
            >
              Simpan Penerimaan
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
                {po.poNumber}
              </span>
              <StatusBadge status={po.status} size="sm" />
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#1b2a24]">
              Dokumen Surat Pesanan (Purchase Order)
            </h1>
            <p className="text-xs text-[#52665d] mt-1">
              Dibuat pada: <span className="font-medium text-[#1b2a24]">{formatDate(po.createdAt, 'long')}</span>
            </p>
          </div>

          {/* Supplier & Destination Card */}
          <div className="bg-[#f8faf9] border border-[#dfe6e2] rounded-2xl px-4 py-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#52665d]">
              <Building2 className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">DISTRIBUTOR (PBF)</div>
                <div className="font-bold text-[#1b2a24]">{po.supplierName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#52665d] border-t border-[#edf1ee] pt-1.5">
              <MapPin className="h-4 w-4 text-[#2d6a4f]" />
              <div>
                <div className="text-[10px] text-[#6b7c74] font-semibold">LOKASI PENERIMAAN</div>
                <div className="font-semibold text-[#1b2a24]">Gudang Farmasi Pusat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-[#52665d] uppercase tracking-wider mb-3">
            Status Alur Pengadaan PO
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-[#c8e6c9] bg-[#f1f8f4] p-3">
              <div className="flex items-center gap-2 font-bold text-[#1b4332]">
                <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                1. Draf PO
              </div>
              <p className="mt-1 text-[11px] text-[#52665d]">Penyusunan item obat</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              po.status !== 'PENDING'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {po.status !== 'PENDING' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                2. Disetujui
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Otorisasi manajer</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              po.status === 'PLACED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {po.status === 'PLACED' || po.status === 'PARTIALLY_RECEIVED' || po.status === 'RECEIVED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                3. Terkirim ke PBF
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Pengiriman distributor</p>
            </div>

            <div className={`rounded-xl border p-3 ${
              po.status === 'RECEIVED'
                ? 'border-[#c8e6c9] bg-[#f1f8f4] text-[#1b4332]'
                : 'border-[#e5eae7] bg-[#f8faf9] text-[#9ca8a2]'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {po.status === 'RECEIVED' ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
                ) : (
                  <Clock className="h-4 w-4 text-[#9ca8a2]" />
                )}
                4. Diterima Lengkap
              </div>
              <p className="mt-1 text-[11px] text-[#6b7c74]">Stok masuk ke Inbound</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top Bento Metric Cards (Uniform Clean White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Jumlah Item Obat (SKU)</span>
            <Package className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{po.items?.length ?? 0} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Daftar varian obat yang dipesan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Progress Unit Diterima</span>
            <PackageCheck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">
            {formatQuantity(totalReceivedUnits)} / {formatQuantity(totalOrderedUnits)}
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total tablet/botol yang telah tiba di gudang</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Nilai PO (Rp)</span>
            <Coins className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(po.total)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total biaya pengadaan obat resmi</p>
        </div>
      </div>

      {/* 4. Line Items Table */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf1ee] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2d6a4f]">
              Rincian Item Obat & Kuantitas Pesanan
            </h2>
            <p className="text-[11px] text-[#6b7c74]">
              {canReceive ? 'Sesuaikan jumlah "Diterima" lalu klik "Simpan Penerimaan"' : 'Daftar item perbekalan farmasi'}
            </p>
          </div>
          <span className="text-xs text-[#6b7c74] font-mono">
            {po.items?.length ?? 0} item
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                <th className="py-3 px-3 w-10 text-center">No.</th>
                <th className="py-3 px-3">Kode KFA / ID Produk</th>
                <th className="py-3 px-3 text-right w-28">Qty Pesan</th>
                <th className="py-3 px-3 text-right w-36">Qty Diterima</th>
                <th className="py-3 px-3 text-right">Harga Satuan</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {lines.map((l, idx) => {
                const isFullyReceived = l.qtyReceived >= l.qty;

                return (
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
                    <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                      {formatNumber(l.qty)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {canReceive ? (
                        <input
                          id={`pr-${l.productId}`}
                          type="number"
                          min="0"
                          max={l.qty}
                          value={l.qtyReceived}
                          onChange={(e) => updateReceivedQty(l.productId, Number(e.target.value))}
                          className="w-24 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-bold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                          aria-label="Diterima"
                        />
                      ) : (
                        <span className={`font-mono font-bold ${isFullyReceived ? 'text-emerald-700' : 'text-[#52665d]'}`}>
                          {formatNumber(l.qtyReceived)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-[#52665d] font-mono">
                      {formatCurrency(l.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#1b2a24]">
                      {formatCurrency(l.qty * l.unitPrice)}
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
                );
              })}
            </tbody>
          </table>
        </div>

        {canReceive && (
          <div className="flex items-center justify-between pt-3 border-t border-[#edf1ee]">
            <p className="text-[11px] text-[#6b7c74]">
              Simpan jumlah penerimaan yang telah diperiksa fisiknya oleh tim Gudang Farmasi.
            </p>
            <Button
              variant="primary"
              size="sm"
              isLoading={working}
              leftIcon={<PackageCheck className="w-4 h-4" />}
              onClick={handleReceive}
            >
              Simpan Penerimaan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  Package,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button, Card, DataTable, EmptyState, ErrorState, Skeleton, StatusBadge, Tabs } from '@/shared/ui';
import type { DataTableColumn, TabItem } from '@/shared/ui';
import { formatCurrency, formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getStockCard } from './api';
import type { StockCard as StockCardData, StockCardItem } from './api';
import type { StockTransaction } from '@/shared/types/domain';

export function StockCard() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const { activeLocationId } = useActiveLocation();

  const [data, setData] = useState<StockCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !activeLocationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStockCard(productId, activeLocationId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat kartu stok');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, activeLocationId]);

  const handleDownloadCsv = () => {
    if (!data) return;
    const txHeaders = ['Tanggal', 'Jenis Mutasi', 'Dokumen Referensi', 'Lot', 'Qty Masuk', 'Qty Keluar', 'Saldo Akhir', 'Petugas'];
    const txRows = data.transactions.map((tx) => [
      `"${tx.date}"`,
      `"${tx.type}"`,
      `"${tx.reference || '—'}"`,
      `"${tx.lot || '—'}"`,
      tx.qtyIn || 0,
      tx.qtyOut || 0,
      tx.balance || 0,
      `"${tx.user || 'system'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [txHeaders.join(','), ...txRows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kartu_Stok_${data.product.kfaCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Produk tidak ditemukan'} title="Kartu Stok & Lot" />;
  }

  const totalStock = data.items.reduce((acc, it) => acc + it.qtyOnHand, 0);
  const totalValuation = totalStock * (data.product.price || 5000);

  const lotColumns: DataTableColumn<StockCardItem>[] = [
    { id: 'lot', header: 'Nomor Lot / Batch', accessorKey: 'lot', isMono: true },
    {
      id: 'expiry',
      header: 'Tanggal Kedaluwarsa',
      cell: (it) => {
        const isExp = it.expiry ? new Date(it.expiry) < new Date() : false;
        return (
          <span className={`font-mono ${isExp ? 'text-rose-600 font-bold' : 'text-[#1b2a24]'}`}>
            {formatDate(it.expiry, 'iso')}
            {isExp && ' (Expired)'}
          </span>
        );
      },
      isMono: true,
    },
    { id: 'bin', header: 'Posisi Bin / Rak', accessorKey: 'bin', isMono: true },
    {
      id: 'qtyOnHand',
      header: 'Qty Fisik (QoH)',
      align: 'right',
      cell: (it) => <span className="font-bold text-[#1b2a24]">{formatQuantity(it.qtyOnHand)}</span>,
    },
    {
      id: 'status',
      header: 'Status Lot',
      cell: (it) => <StatusBadge status={it.status} size="sm" />,
    },
  ];

  const txColumns: DataTableColumn<StockTransaction>[] = [
    { id: 'date', header: 'Waktu Transaksi', accessorKey: 'date', isMono: true },
    {
      id: 'type',
      header: 'Jenis Mutasi',
      cell: (tx) => {
        const isEntry = tx.type === 'IN' || tx.type === 'TRANSFER_IN';
        const isExit = tx.type === 'OUT' || tx.type === 'TRANSFER_OUT';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isEntry
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isExit
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isEntry && <TrendingUp className="h-3 w-3" />}
            {isExit && <TrendingDown className="h-3 w-3" />}
            {tx.type}
          </span>
        );
      },
    },
    {
      id: 'reference',
      header: 'Dokumen Acuan',
      cell: (tx) => <span className="font-mono text-[11px] text-[#2d6a4f] font-medium">{tx.reference || '—'}</span>,
    },
    { id: 'lot', header: 'Lot Terkait', accessorKey: 'lot', isMono: true },
    {
      id: 'qtyIn',
      header: 'Masuk (+)',
      align: 'right',
      cell: (tx) => (
        <span className={tx.qtyIn ? 'font-bold text-emerald-600' : 'text-[#9ca8a2]'}>
          {tx.qtyIn ? `+${formatQuantity(tx.qtyIn)}` : '—'}
        </span>
      ),
    },
    {
      id: 'qtyOut',
      header: 'Keluar (-)',
      align: 'right',
      cell: (tx) => (
        <span className={tx.qtyOut ? 'font-bold text-rose-600' : 'text-[#9ca8a2]'}>
          {tx.qtyOut ? `-${formatQuantity(tx.qtyOut)}` : '—'}
        </span>
      ),
    },
    {
      id: 'balance',
      header: 'Saldo Akhir',
      align: 'right',
      cell: (tx) => <span className="font-bold text-[#1b2a24]">{formatQuantity(tx.balance)}</span>,
    },
    { id: 'user', header: 'Petugas Otorisasi', accessorKey: 'user' },
  ];

  const tabs: TabItem[] = [
    {
      id: 'history',
      label: 'Riwayat Buku Besar (Ledger)',
      count: data.transactions.length,
      content:
        data.transactions.length === 0 ? (
          <EmptyState title="Belum ada transaksi" description="Belum ada catatan mutasi masuk/keluar untuk produk ini." />
        ) : (
          <DataTable
            data={data.transactions}
            columns={txColumns}
            keyExtractor={(tx) => `${tx.date}-${tx.reference ?? tx.type}-${tx.lot ?? ''}`}
          />
        ),
    },
    {
      id: 'lots',
      label: 'Daftar Lot & Bin Aktif',
      count: data.items.length,
      content:
        data.items.length === 0 ? (
          <EmptyState title="Tidak ada lot" description="Belum ada batch persediaan untuk produk ini di lokasi aktif." />
        ) : (
          <DataTable
            data={data.items}
            columns={lotColumns}
            keyExtractor={(it) => it.lot}
          />
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
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
          >
            Ekspor Kartu Stok (CSV)
          </Button>
        </div>
      </div>

      {/* 2. Master Product Card */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#edf1ee] pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2d6a4f] bg-[#e8f5e9] px-2.5 py-0.5 rounded-full border border-[#c8e6c9]">
              Kode KFA: {data.product.kfaCode}
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-[#1b2a24]">{data.product.name}</h1>
            <p className="text-xs text-[#52665d] mt-1">
              Zat Aktif: <span className="font-semibold text-[#1b2a24]">{data.product.zatAktif || '—'}</span> · NIE BPOM: <span className="font-mono text-[#1b2a24]">{data.product.nie || '—'}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-[#f8faf9] border border-[#dfe6e2] text-[#52665d] px-3 py-1.5 rounded-xl font-medium">
              Lokasi: <strong className="text-[#1b2a24]">{activeLocationId}</strong>
            </span>
            <span className="bg-[#e8f5e9] border border-[#c8e6c9] text-[#2d6a4f] px-3 py-1.5 rounded-xl font-bold">
              UOM: {data.product.uom || 'Tablet'}
            </span>
          </div>
        </div>

        {/* Product Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <div className="text-[11px] font-semibold text-[#6b7c74] uppercase tracking-wider">Kekuatan Dosis</div>
            <div className="mt-1 font-medium text-[#1b2a24]">{data.product.kekuatan || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#6b7c74] uppercase tracking-wider">Bentuk Sediaan</div>
            <div className="mt-1 font-medium text-[#1b2a24]">{data.product.dosageForm || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#6b7c74] uppercase tracking-wider">Pabrikan Farmasi</div>
            <div className="mt-1 font-medium text-[#1b2a24]">{data.product.manufacturer || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#6b7c74] uppercase tracking-wider">Kategori Farmasi</div>
            <div className="mt-1 font-medium text-[#1b2a24]">{data.product.category || '—'}</div>
          </div>
        </div>
      </div>

      {/* 3. Summary Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="text-xs font-semibold text-[#52665d]">Total Saldo Fisik Saat Ini</div>
          <div className="mt-1.5 text-2xl font-black text-[#1b2a24]">{formatQuantity(totalStock)} {data.product.uom || 'Unit'}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Saldo persediaan riil</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="text-xs font-semibold text-[#52665d]">Total Lot / Batch Aktif</div>
          <div className="mt-1.5 text-2xl font-black text-[#1b2a24]">{data.items.length} Batch</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Batch aktif di lokasi</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="text-xs font-semibold text-[#52665d]">Estimasi Total Nilai Persediaan</div>
          <div className="mt-1.5 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalValuation)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Berdasarkan HET acuan</p>
        </div>
      </div>

      {/* 4. Tab Container: Ledger & Lots */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <Tabs items={tabs} defaultTabId="history" />
      </div>
    </div>
  );
}
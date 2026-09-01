"use client";

import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ChevronRight,
  ClipboardList,
  PackageCheck,
  PackageOpen,
  Plus,
  Share2,
} from 'lucide-react';
import { ErrorState, Skeleton } from '@/shared/ui';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getDashboardSummary, getDashboardTrend } from './api';
import type {
  DashboardSummary,
  DashboardTrendData,
} from './api';
import {
  ExpirationChart,
  IncomingByStatus,
  InventorySummary,
  OutgoingByAge,
} from './components';

const numberFormatter = new Intl.NumberFormat('id-ID');
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const PANEL_CLASS = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';

function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: unknown): string {
  return numberFormatter.format(safeNumber(value));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  detail: ReactNode;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone?: 'emerald' | 'amber' | 'blue' | 'rose';
}

function MetricCard({ title, value, unit, detail, href, icon: Icon, iconTone = 'emerald' }: MetricCardProps) {
  const iconClasses = {
    emerald: 'bg-[#eff9f2] text-[#2d6a4f]',
    amber: 'bg-[#fffbeb] text-[#d97706]',
    blue: 'bg-[#eff6ff] text-[#2563eb]',
    rose: 'bg-[#fff1f2] text-[#e11d48]',
  }[iconTone];

  return (
    <article
      className={`${PANEL_CLASS} group relative flex min-h-[136px] flex-col justify-between p-5 transition-all hover:shadow-[0_4px_14px_rgba(27,42,36,0.07)] hover:border-[#b7e4c7]`}
    >
      <Link
        href={href}
        aria-label={`Lihat detail ${title}`}
        className="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7c74]">{title}</p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${iconClasses}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[32px] font-extrabold leading-none tracking-[-0.045em] text-[#1b2a24] tabular-nums">
          {value}
        </span>
        <span className="text-[11px] font-bold uppercase text-[#6b7c74]">{unit}</span>
      </div>
      <div className="mt-2 text-[11px] text-[#6b7c74]">
        {detail}
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[136px] rounded-[20px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[380px] rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { activeLocationId } = useActiveLocation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<DashboardTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, trendResponse] = await Promise.all([
        getDashboardSummary(activeLocationId),
        getDashboardTrend(),
      ]);
      setSummary(summaryResponse);
      setTrend(trendResponse);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getDashboardSummary(activeLocationId), getDashboardTrend()])
      .then(([summaryResponse, trendResponse]) => {
        if (!active) return;
        setSummary(summaryResponse);
        setTrend(trendResponse);
      })
      .catch((fetchError: unknown) => {
        if (active) setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat data dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeLocationId]);

  const handleShareReport = async () => {
    const shareData = {
      title: 'SIGMA Dashboard Overview',
      text: 'Ringkasan operasional supply chain medis SIGMA.',
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard?.writeText(shareData.url);
    } catch {
      return;
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error || !summary || !trend) {
    return (
      <ErrorState
        className={`${PANEL_CLASS} min-h-64`}
        title="Gagal Memuat Dashboard"
        message={error || 'Data operasional tidak tersedia.'}
        onRetry={fetchData}
      />
    );
  }

  // Stock In Recent Receipts
  const recentInboundReceipts = [
    {
      id: 'in-1',
      docNumber: 'IN-2026-3012',
      supplier: 'PT Kimia Farma Trading',
      quantity: 85,
      date: '2026-09-01',
      status: 'VERIFIKASI',
      statusTone: 'bg-[#fef3c7] text-[#a66710] border-[#fde68a]',
      href: '/inbound',
    },
    {
      id: 'in-2',
      docNumber: 'IN-2026-3015',
      supplier: 'PT Kalbe Farma Tbk',
      quantity: 46,
      date: '2026-08-31',
      status: 'SELESAI',
      statusTone: 'bg-[#d8f3dc] text-[#2d6a4f] border-[#b7e4c7]',
      href: '/inbound',
    },
    {
      id: 'in-3',
      docNumber: 'PO-2026-11002',
      supplier: 'PT Mensa Bina Sukses',
      quantity: 60,
      date: '2026-08-31',
      status: 'SELESAI',
      statusTone: 'bg-[#d8f3dc] text-[#2d6a4f] border-[#b7e4c7]',
      href: '/inbound',
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header (Clean & Modern) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#1b2a24] sm:text-3xl">
            Dashboard Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleShareReport()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5eae7] bg-white px-3.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f5f3]"
          >
            <Share2 className="h-4 w-4 text-[#6b7c74]" /> Bagikan Laporan
          </button>
          <Link
            href="/inbound"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#b7e4c7] bg-[#eff9f2] px-3.5 text-xs font-bold text-[#2d6a4f] shadow-sm transition hover:bg-[#d8f3dc]"
          >
            <PackageCheck className="h-4 w-4" /> Penerimaan Barang
          </Link>
          <Link
            href="/requisitions/create"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#22543d]"
          >
            <Plus className="h-4 w-4" /> Buat Permintaan
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards Row (Clean Numbers, Icon at Top-Right) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan inventori">
        <MetricCard
          title="Persediaan Aktif"
          value={formatNumber(summary.activeInventoryQuantity)}
          unit="UNIT"
          href="/inventory?status=ACTIVE"
          icon={Boxes}
          iconTone="emerald"
          detail={
            <>
              <strong className="text-[#2d6a4f]">{formatNumber(summary.activeLotCount)} lot</strong> pada{' '}
              {formatNumber(summary.activeBinCount)} bin di {summary.locationName}
            </>
          }
        />

        <MetricCard
          title="Penerimaan Berjalan"
          value={formatNumber(summary.openInboundQuantity)}
          unit="UNIT"
          href="/inbound"
          icon={ArrowDownToLine}
          iconTone="blue"
          detail={
            <>
              <strong className="text-[#2d6a4f]">
                {formatNumber(summary.openInboundReceiptCount)} dokumen
              </strong>{' '}
              menuju {summary.locationName}
            </>
          }
        />

        <MetricCard
          title="Pengeluaran Berjalan"
          value={formatNumber(summary.inProgressShipmentCount)}
          unit="PENGELUARAN"
          href="/outbound"
          icon={ArrowUpFromLine}
          iconTone="amber"
          detail={
            <>
              <strong className="text-[#2d6a4f]">
                {formatNumber(summary.inProgressShipmentQuantity)} unit
              </strong>{' '}
              masih diproses dari {summary.locationName}
            </>
          }
        />

        <MetricCard
          title="Permintaan Diproses"
          value={formatNumber(summary.inProgressRequisitionCount)}
          unit="PERMINTAAN"
          href="/requisitions"
          icon={ClipboardList}
          iconTone="rose"
          detail={
            <>
              <strong className="text-[#2d6a4f]">
                {formatNumber(summary.inProgressRequisitionQuantity)} unit
              </strong>{' '}
              masih dalam alur pemenuhan
            </>
          }
        />
      </section>

      {/* 3. Balanced 2x2 Grid - Row 1 (Inventory Summary + Expiration Summary) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Ringkasan persediaan dan kedaluwarsa">
        <InventorySummary data={trend.inventoryStatusSummary} />
        <ExpirationChart data={trend.expirationSummary} />
      </section>

      {/* 4. Balanced 2x2 Grid - Row 2 (Stock In Status + Stock Out Status) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Pergerakan stok masuk dan keluar">
        <IncomingByStatus />
        <OutgoingByAge />
      </section>

      {/* 5. Balanced 50:50 Bottom Section (Penerimaan Supplier [Kiri] VS Permintaan Unit [Kanan]) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Penerimaan supplier dan permintaan unit">
        {/* Kolom Kiri: Penerimaan Supplier (Stock In) */}
        <div className={`${PANEL_CLASS} flex flex-col justify-between p-6`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-[#2d6a4f]" />
                <h2 className="font-display text-base font-bold text-[#1b2a24]">
                  Penerimaan Supplier (Stock In)
                </h2>
              </div>
              <Link
                href="/inbound"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2d6a4f] hover:underline"
              >
                Lihat Semua
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentInboundReceipts.map((receipt) => (
                <Link
                  key={receipt.id}
                  href={receipt.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ee] bg-[#f8faf9] p-3.5 transition hover:border-[#b9dfc7] hover:bg-white"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e5eae7] bg-white text-[#2563eb]">
                      <PackageCheck className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-bold text-[#1b2a24]">
                        {receipt.docNumber}
                      </strong>
                      <small className="block truncate text-[11px] font-semibold text-[#6b7c74]">
                        {receipt.supplier} • {receipt.quantity} box
                      </small>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <em className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold not-italic ${receipt.statusTone}`}>
                      {receipt.status}
                    </em>
                    <small className="mt-1 block text-[10px] text-[#9ca8a2]">
                      {dateFormatter.format(new Date(receipt.date))}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Penerimaan tervalidasi nomor batch, Exp. Date, dan surat jalan
          </div>
        </div>

        {/* Kolom Kanan: Permintaan Unit (Stock Out) */}
        <div className={`${PANEL_CLASS} flex flex-col justify-between p-6`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-[#2d6a4f]" />
                <h2 className="font-display text-base font-bold text-[#1b2a24]">
                  Permintaan Unit (Stock Out)
                </h2>
              </div>
              <Link
                href="/requisitions"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2d6a4f] hover:underline"
              >
                Lihat Semua
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {trend.recentTransactions.length === 0 ? (
                <p className="rounded-xl bg-[#f8faf9] p-4 text-xs text-[#6b7c74]">
                  Belum ada transaksi permintaan terbaru.
                </p>
              ) : (
                trend.recentTransactions.slice(0, 3).map((transaction) => (
                  <Link
                    key={transaction.id}
                    href={transaction.href}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ee] bg-[#f8faf9] p-3.5 transition hover:border-[#b9dfc7] hover:bg-white"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e5eae7] bg-white text-[#2d6a4f]">
                        <PackageOpen className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-xs font-bold text-[#1b2a24]">
                          {transaction.reference}
                        </strong>
                        <small className="block text-[11px] font-semibold text-[#6b7c74]">
                          {formatNumber(transaction.quantity)} unit obat diminta
                        </small>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <em className="inline-block rounded-full border border-[#b7e4c7] bg-[#d8f3dc] px-2.5 py-0.5 text-[9px] font-bold not-italic text-[#2d6a4f]">
                        {transaction.status}
                      </em>
                      <small className="mt-1 block text-[10px] text-[#9ca8a2]">
                        {dateFormatter.format(new Date(transaction.occurredAt))}
                      </small>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Alur pengeluaran FEFO terstandarisasi untuk unit layanan
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  MoreHorizontal,
  Plus,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, Skeleton, ErrorState } from '@/shared/ui';
import { getDashboardSummary, getDashboardTrend } from './api';
import type { DashboardSummary, DashboardTrendData } from './api';

const CHART_COLORS = {
  navy: '#173b66',
  blue: '#4a8ff0',
  sky: '#8bc5ff',
  cyan: '#62c7d7',
  violet: '#9d83eb',
  green: '#39a878',
  amber: '#eba94d',
  red: '#e66f69',
  grid: '#e7eef8',
  muted: '#8291a8',
};

const numberFormatter = new Intl.NumberFormat('id-ID');

const tooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  border: '1px solid #dfe9f6',
  borderRadius: '14px',
  boxShadow: '0 14px 34px rgba(35, 72, 118, 0.12)',
  color: '#173b66',
  fontSize: '11px',
};

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  detail: ReactNode;
  href: string;
  visual: 'pulse' | 'curve' | 'bars' | 'steps';
}

function MetricVisual({ variant }: { variant: MetricCardProps['visual'] }) {
  if (variant === 'pulse') {
    return (
      <svg className="h-10 w-24 shrink-0 text-[#4a8ff0]" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <path d="M1 22h19l6-14 6 27 7-19 7 10 8-4h12l6-10 7 20 7-10h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'curve') {
    return (
      <svg className="h-10 w-24 shrink-0 text-[#4a8ff0]" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <path d="M1 27c18 0 25-11 43-11 20 0 29 14 55 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M1 33h98" stroke="#e4eefb" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
    );
  }

  const barHeights = variant === 'bars' ? [16, 29, 21, 34, 25, 38, 27] : [35, 32, 29, 25, 21, 18, 15];
  return (
    <div className="flex h-10 w-24 shrink-0 items-end gap-1.5" aria-hidden="true">
      {barHeights.map((height, index) => (
        <span
          key={`${variant}-${index}`}
          className={`w-1.5 rounded-t-full ${index < 4 ? 'bg-[#4a8ff0]' : 'bg-[#a8ccfb]'}`}
          style={{ height }}
        />
      ))}
    </div>
  );
}

function MetricCard({ title, value, unit, detail, href, visual }: MetricCardProps) {

  return (
    <article className="group flex min-h-[180px] flex-col justify-between rounded-[20px] border border-[#dfe7f0] bg-white/92 p-5 shadow-[0_3px_12px_rgba(35,72,118,0.04)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-[#cfdef0] hover:shadow-[0_10px_26px_rgba(35,72,118,0.08)]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#62768e]">{title}</p>
          <Link
            href={href}
            aria-label={`Lihat detail ${title}`}
            className="grid h-7 w-7 place-items-center rounded-full text-[#9ba9b8] transition hover:bg-[#edf4fd] hover:text-[#397fdc]"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[30px] font-bold leading-none tracking-[-0.045em] text-[#142f52] tabular-nums sm:text-[32px]">{value}</span>
          <span className="text-[10px] font-semibold text-[#70839a]">{unit}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <MetricVisual variant={visual} />
        <p className="text-[10px] leading-[1.45] text-[#708198] sm:text-[11px]">{detail}</p>
      </div>
    </article>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-64 rounded-xl bg-white/70" />
        <Skeleton className="h-10 w-72 rounded-xl bg-white/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[180px] w-full rounded-[20px] bg-white/70" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <Skeleton className="h-[430px] w-full rounded-[28px] bg-white/70" />
        <Skeleton className="h-[430px] w-full rounded-[28px] bg-white/70" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<DashboardTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, trendResponse] = await Promise.all([
        getDashboardSummary(),
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

  const handleShareReport = async () => {
    const shareData = {
      title: 'SIGMA Dashboard Overview',
      text: 'Ringkasan operasional supply chain SIGMA.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard?.writeText(shareData.url);
    } catch {
      return;
    }
  };

  useEffect(() => {
    let isActive = true;

    Promise.all([getDashboardSummary(), getDashboardTrend()])
      .then(([summaryResponse, trendResponse]) => {
        if (!isActive) return;
        setSummary(summaryResponse);
        setTrend(trendResponse);
      })
      .catch((fetchError: unknown) => {
        if (!isActive) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat data dashboard');
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !summary || !trend) {
    return (
      <ErrorState
        className="rounded-[28px] border-white/70 bg-white/80 shadow-[0_20px_50px_rgba(45,79,119,0.08)] backdrop-blur-xl"
        title="Gagal Memuat Dashboard"
        message={error || 'Terjadi kesalahan sistem saat mengambil data rantai pasok.'}
        onRetry={fetchData}
      />
    );
  }

  const safeStockCount = Math.max(
    summary.totalProducts - summary.lowStockCount - summary.stockoutCount - summary.expiring30DaysCount,
    0
  );
  const stockStatusData = [
    { name: 'Stok aman', value: safeStockCount, color: CHART_COLORS.blue },
    { name: 'Stok menipis', value: summary.lowStockCount, color: CHART_COLORS.amber },
    { name: 'Stok habis', value: summary.stockoutCount, color: CHART_COLORS.red },
    { name: 'Kedaluwarsa ≤30 hari', value: summary.expiring30DaysCount, color: CHART_COLORS.violet },
  ];
  const totalAttention = summary.lowStockCount + summary.stockoutCount + summary.expiring30DaysCount;
  const latestStockout = trend.monthlyStockout.at(-1)?.stockoutCount ?? 0;

  return (
    <div className="relative space-y-7 pb-4">
      <section className="space-y-5" aria-labelledby="dashboard-overview-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="dashboard-overview-title" className="text-2xl font-bold tracking-[-0.04em] text-[#132e50] sm:text-3xl">
              Dashboard Overview
            </h1>
            <p className="mt-1.5 text-[11px] text-[#7b8ca1] sm:text-xs">
              Ringkasan kesehatan stok dan arus permintaan hari ini
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => void handleShareReport()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce5ef] bg-white px-4 text-[11px] font-semibold text-[#294765] shadow-[0_2px_7px_rgba(35,72,118,0.05)] transition hover:border-[#c7d8eb] hover:bg-[#f8fbff] sm:text-xs"
            >
              <Share2 className="h-4 w-4 text-[#68819a]" strokeWidth={1.9} />
              Bagikan Laporan
            </button>
            <Link
              href="/requisitions/create"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1769e8] px-4 text-[11px] font-semibold text-white shadow-[0_7px_18px_rgba(23,105,232,0.2)] transition hover:bg-[#0d5acb] sm:text-xs"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Buat Permintaan
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Produk"
            value={numberFormatter.format(summary.totalProducts)}
            unit="SKU"
            href="/products"
            visual="pulse"
            detail={<>Produk aktif terdaftar di <strong className="font-semibold text-[#2f6fbd]">seluruh jaringan layanan</strong></>}
          />
          <MetricCard
            title="Stok Menipis"
            value={numberFormatter.format(summary.lowStockCount)}
            unit="SKU"
            href="/inventory?status=LOW_STOCK"
            visual="curve"
            detail={<>Item telah mencapai <strong className="font-semibold text-[#2f6fbd]">batas stok minimum</strong></>}
          />
          <MetricCard
            title="Stok Habis"
            value={numberFormatter.format(summary.stockoutCount)}
            unit="SKU"
            href="/inventory?status=OUT_OF_STOCK"
            visual="bars"
            detail={<>Item membutuhkan <strong className="font-semibold text-[#2f6fbd]">tindak lanjut segera</strong></>}
          />
          <MetricCard
            title="Pending Requisition"
            value={numberFormatter.format(summary.pendingRequisitionsCount)}
            unit="REQ"
            href="/requisitions?status=PENDING_REVIEW"
            visual="steps"
            detail={<>Permintaan masih <strong className="font-semibold text-[#2f6fbd]">menunggu persetujuan</strong></>}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <Card shadow="none" className="rounded-[28px] border-white/80 bg-white/88 shadow-[0_20px_55px_rgba(40,78,124,0.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7d8da4]">Performance trend</p>
              <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#183b63]">Tren Pemenuhan Permintaan (Fill Rate)</h2>
              <p className="mt-1 text-[11px] text-[#8695a8]">Volume pasok dan rasio pemenuhan per bulan</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#f6f9fd] px-3 py-2 text-[10px] font-semibold text-[#718298]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#173b66]" />Volume pasok</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#6aa7f5]" />Fill rate</span>
            </div>
          </div>
          <div className="mt-7 h-[300px] w-full sm:h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.monthlyFillRate} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRateLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#91c7ff" />
                    <stop offset="100%" stopColor="#4a8ff0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="4 5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} dy={10} />
                <YAxis yAxisId="volume" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 10 }} />
                <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} hide />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#cbdcf0', strokeDasharray: '4 4' }} />
                <Line yAxisId="volume" type="monotone" dataKey="qtyLeft" name="Volume Pasok" stroke={CHART_COLORS.navy} strokeWidth={2.5} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                <Line yAxisId="rate" type="monotone" dataKey="fillRatePercent" name="Fill Rate %" stroke="url(#fillRateLine)" strokeWidth={3} dot={{ r: 3.5, fill: '#fff', stroke: CHART_COLORS.blue, strokeWidth: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card shadow="none" className="rounded-[28px] border-white/80 bg-white/88 shadow-[0_20px_55px_rgba(40,78,124,0.08)] backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7d8da4]">Inventory health</p>
          <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#183b63]">Distribusi Status Stok</h2>
          <p className="mt-1 text-[11px] text-[#8695a8]">Proporsi kesehatan stok keseluruhan</p>

          <div className="relative mx-auto mt-2 h-[220px] max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockStatusData} cx="50%" cy="50%" innerRadius={66} outerRadius={88} paddingAngle={5} cornerRadius={8} dataKey="value" stroke="none">
                  {stockStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[28px] font-bold leading-none tracking-[-0.05em] text-[#183b63]">{totalAttention}</p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.13em] text-[#8b9aac]">Perlu perhatian</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {stockStatusData.map((item) => (
              <div key={item.name} className="rounded-2xl border border-[#edf2f8] bg-[#f9fbfe] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-[9px] font-semibold text-[#78889c]">{item.name}</span>
                </div>
                <p className="mt-1.5 pl-4 text-sm font-bold text-[#24486f]">
                  {numberFormatter.format(item.value)} SKU
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card shadow="none" className="rounded-[26px] border-white/80 bg-white/88 shadow-[0_18px_48px_rgba(40,78,124,0.07)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8da4]">Stockout monitor</p>
              <h3 className="mt-1 text-base font-bold text-[#183b63]">Tren Stok Habis</h3>
            </div>
            <span className="rounded-2xl bg-[#fff0ee] px-3 py-2 text-[10px] font-bold text-[#c9544d]">{latestStockout} terbaru</span>
          </div>
          <div className="mt-5 h-[215px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.monthlyStockout} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="4 5" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 9 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="stockoutCount" name="Stockout" stroke={CHART_COLORS.red} strokeWidth={3} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card shadow="none" className="rounded-[26px] border-white/80 bg-white/88 shadow-[0_18px_48px_rgba(40,78,124,0.07)] backdrop-blur-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8da4]">Category flow</p>
          <h3 className="mt-1 text-base font-bold text-[#183b63]">Pengeluaran per Kelas Terapi</h3>
          <div className="mt-5 h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.categoryBreakdown} margin={{ top: 8, right: 4, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="categoryBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#65a7f4" />
                    <stop offset="100%" stopColor="#9dcbff" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="4 5" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 8 }} tickFormatter={(value) => value.split(' ')[0]} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: CHART_COLORS.muted, fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="quantity" name="Jumlah Unit" fill="url(#categoryBar)" radius={[8, 8, 3, 3]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card shadow="none" className="rounded-[26px] border-white/80 bg-white/88 shadow-[0_18px_48px_rgba(40,78,124,0.07)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7d8da4]">Movement ranking</p>
              <h3 className="mt-1 text-base font-bold text-[#183b63]">Top 5 Produk Fast-Moving</h3>
            </div>
            <Sparkles className="h-5 w-5 text-[#7b9fc6]" strokeWidth={1.7} />
          </div>
          <div className="mt-5 space-y-3">
            {trend.fastMovers.slice(0, 5).map((product, index) => {
              const maximum = Math.max(...trend.fastMovers.map((item) => item.totalQty), 1);
              const width = Math.max((product.totalQty / maximum) * 100, 6);
              return (
                <div key={`${product.name}-${index}`} className="rounded-2xl bg-[#f7faff] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white text-[9px] font-bold text-[#4b79a8] shadow-sm">{index + 1}</span>
                      <span className="truncate text-[10px] font-semibold text-[#47617f]" title={product.name}>{product.name}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-[#234970]">{numberFormatter.format(product.totalQty)}</span>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e6eef8]">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#82bbf7,#4b8fe4)]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/reports" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#4a7fb5] transition hover:text-[#285f99]">
            Lihat laporan lengkap <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>

      <section className="rounded-[26px] border border-white/80 bg-[linear-gradient(110deg,rgba(255,255,255,0.88),rgba(233,245,255,0.86))] p-5 shadow-[0_18px_48px_rgba(40,78,124,0.07)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e9f3ff] text-[#4386d3]">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-sm font-bold text-[#24486f]">Fokus operasional berikutnya</p>
              <p className="mt-1 max-w-3xl text-[11px] leading-5 text-[#788ba2]">
                Ada {totalAttention} SKU yang perlu perhatian dan {summary.pendingRequisitionsCount} permintaan menunggu persetujuan. Prioritaskan item stockout sebelum menyusun pengadaan ulang.
              </p>
            </div>
          </div>
          <Link href="/inventory/reorder" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#d4e5f6] bg-white px-4 text-[10px] font-bold text-[#376b9f] shadow-sm transition hover:-translate-y-0.5">
            Buka rekomendasi reorder <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

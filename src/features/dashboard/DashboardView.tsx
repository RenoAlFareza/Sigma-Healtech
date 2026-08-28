"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardClock,
  PackageCheck,
  PackageX,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  detail: string;
  icon: LucideIcon;
  tone: 'blue' | 'cyan' | 'amber' | 'red';
}

function MetricCard({ title, value, detail, icon: Icon, tone }: MetricCardProps) {
  const tones = {
    blue: {
      icon: 'bg-[#e9f2ff] text-[#397fdc]',
      glow: 'bg-[#90bdff]',
    },
    cyan: {
      icon: 'bg-[#e4f8fa] text-[#278a9c]',
      glow: 'bg-[#7dd5e1]',
    },
    amber: {
      icon: 'bg-[#fff5df] text-[#b97716]',
      glow: 'bg-[#f5c86d]',
    },
    red: {
      icon: 'bg-[#fff0ee] text-[#c9544d]',
      glow: 'bg-[#ef9b95]',
    },
  };

  return (
    <Card
      shadow="none"
      className="group relative min-h-[154px] rounded-[24px] border-white/80 bg-white/82 p-0 shadow-[0_18px_45px_rgba(40,78,124,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(40,78,124,0.12)]"
    >
      <div className={`absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-10 blur-2xl ${tones[tone].glow}`} />
      <div className="relative flex h-full flex-col justify-between gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-[150px] text-[11px] font-bold uppercase tracking-[0.12em] text-[#728198]">
            {title}
          </p>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tones[tone].icon}`}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
          </span>
        </div>
        <div>
          <p className="text-[30px] font-bold leading-none tracking-[-0.05em] text-[#183b63]">
            {value}
          </p>
          <p className="mt-2 text-[11px] font-medium text-[#8a98aa]">{detail}</p>
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7d8da4]">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-bold tracking-[-0.025em] text-[#183b63] sm:text-xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      <Skeleton className="h-[250px] w-full rounded-[30px] bg-white/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[154px] w-full rounded-[24px] bg-white/70" />
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
      <section className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(118deg,rgba(255,255,255,0.96)_0%,rgba(242,249,255,0.92)_56%,rgba(218,237,255,0.88)_100%)] px-5 py-6 shadow-[0_24px_70px_rgba(42,81,126,0.10)] sm:px-8 sm:py-8 lg:px-10">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#82b9ff]/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-100px] left-[42%] h-52 w-52 rounded-full bg-[#b9e8f3]/35 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d8e8f8] bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#47709d] shadow-sm">
                <Activity className="h-3.5 w-3.5 text-[#4b94e8]" strokeWidth={2} />
                Operations overview
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#62819f]">
                <span className="h-2 w-2 rounded-full bg-[#42b887] shadow-[0_0_0_4px_rgba(66,184,135,0.12)]" />
                Sistem aktif
              </span>
            </div>

            <h1 className="mt-5 max-w-2xl text-[30px] font-bold leading-[1.08] tracking-[-0.045em] text-[#163a63] sm:text-[40px]">
              Dashboard Pemantauan Logistik
            </h1>
            <p className="mt-3 max-w-2xl text-xs leading-6 text-[#6f8198] sm:text-sm">
              Kendalikan persediaan, arus permintaan, dan kesehatan stok dari satu tampilan operasional yang lebih jernih.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/requisitions/create"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#183d68] px-5 text-xs font-bold text-white shadow-[0_12px_28px_rgba(24,61,104,0.24)] transition hover:-translate-y-0.5 hover:bg-[#214d7e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a8ff0]"
              >
                Buat permintaan
                <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
              </Link>
              <Link
                href="/inventory"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dbe8f5] bg-white/75 px-5 text-xs font-bold text-[#355d87] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Lihat inventori
                <ChevronRight className="h-4 w-4" strokeWidth={1.9} />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[330px] items-center justify-center lg:justify-end">
            <div className="relative grid h-[190px] w-[190px] place-items-center rounded-full bg-[conic-gradient(#4a8ff0_var(--health),#dcecff_0)] p-[13px] shadow-[0_24px_60px_rgba(69,126,189,0.18)]" style={{ '--health': `${Math.min(summary.fillRatePercentage, 100)}%` } as React.CSSProperties}>
              <div className="grid h-full w-full place-items-center rounded-full border border-white bg-white/95 text-center shadow-[inset_0_0_32px_rgba(102,163,224,0.09)]">
                <div>
                  <PackageCheck className="mx-auto h-5 w-5 text-[#4a8ff0]" strokeWidth={1.8} />
                  <p className="mt-2 text-[34px] font-bold leading-none tracking-[-0.06em] text-[#173b66]">
                    {summary.fillRatePercentage}%
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8291a8]">Fill rate</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-1 right-0 rounded-2xl border border-white bg-white/90 px-3.5 py-2.5 shadow-[0_12px_30px_rgba(42,81,126,0.12)] backdrop-blur-md sm:right-4">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#368c6a]">
                <TrendingUp className="h-3.5 w-3.5" /> Target ≥95%
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="overview-title">
        <SectionTitle eyebrow="Ringkasan hari ini" title="Kondisi operasional" />
        <div id="overview-title" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Produk"
            value={numberFormatter.format(summary.totalProducts)}
            detail="SKU terdaftar di seluruh lokasi"
            icon={Boxes}
            tone="blue"
          />
          <MetricCard
            title="Stok Menipis"
            value={numberFormatter.format(summary.lowStockCount)}
            detail="Perlu perencanaan pengadaan"
            icon={AlertTriangle}
            tone="amber"
          />
          <MetricCard
            title="Stok Habis"
            value={numberFormatter.format(summary.stockoutCount)}
            detail="Butuh tindak lanjut segera"
            icon={PackageX}
            tone="red"
          />
          <MetricCard
            title="Pending Requisition"
            value={numberFormatter.format(summary.pendingRequisitionsCount)}
            detail="Menunggu proses persetujuan"
            icon={ClipboardClock}
            tone="cyan"
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

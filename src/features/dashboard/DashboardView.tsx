"use client";

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, MoreHorizontal, PackageOpen, Plus, Share2, WalletCards } from 'lucide-react';
import { ErrorState, Skeleton } from '@/shared/ui';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getDashboardSummary, getDashboardTrend } from './api';
import type { DashboardSummary, DashboardTrendData, OperationalSchedule, RecentActivity, WeeklyFulfillmentPoint } from './api';

const numberFormatter = new Intl.NumberFormat('id-ID');
const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const PANEL_CLASS = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';

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
      <svg className="h-10 w-24 shrink-0 text-[#52b788]" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <path d="M1 22h19l6-14 6 27 7-19 7 10 8-4h12l6-10 7 20 7-10h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (variant === 'curve') {
    return (
      <svg className="h-10 w-24 shrink-0 text-[#52b788]" viewBox="0 0 100 40" fill="none" aria-hidden="true">
        <path d="M1 27c18 0 25-11 43-11 20 0 29 14 55 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  const heights = variant === 'bars' ? [16, 29, 21, 34, 25, 38, 27] : [36, 34, 31, 27, 23, 19, 16];
  return (
    <div className="flex h-10 w-24 shrink-0 items-end gap-1.5" aria-hidden="true">
      {heights.map((height, index) => (
        <span key={`${variant}-${index}`} className={`w-1.5 rounded-t-sm ${index < 4 ? 'bg-[#52b788]' : 'bg-[#b7d8ff]'}`} style={{ height }} />
      ))}
    </div>
  );
}

function MetricCard({ title, value, unit, detail, href, visual }: MetricCardProps) {
  return (
    <article className={`${PANEL_CLASS} group relative flex min-h-[146px] flex-col justify-between p-5 transition-shadow hover:shadow-[0_4px_14px_rgba(27,42,36,0.07)]`}>
      <Link href={href} aria-label={`Lihat detail ${title}`} className="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7c74]">{title}</p>
        <span className="grid h-6 w-6 place-items-center rounded-full text-[#9ca8a2] transition group-hover:bg-[#f1f5f3] group-hover:text-[#2d6a4f]"><MoreHorizontal className="h-4 w-4" /></span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[30px] font-bold leading-none tracking-[-0.045em] text-[#1b2a24] tabular-nums">{value}</span>
        <span className="text-[10px] font-semibold text-[#6b7c74]">{unit}</span>
      </div>
      <div className="mt-3 flex items-center gap-3"><MetricVisual variant={visual} /><p className="text-[10px] leading-[1.4] text-[#6b7c74] sm:text-[11px]">{detail}</p></div>
    </article>
  );
}

function FulfillmentChart({ data }: { data: WeeklyFulfillmentPoint[] }) {
  const chartMax = 150;
  const stages = [
    { key: 'requested' as const, color: '#b7e4c7', label: 'Diminta' },
    { key: 'approved' as const, color: '#95d5b2', label: 'Disetujui' },
    { key: 'issued' as const, color: '#52b788', label: 'Dikeluarkan' },
    { key: 'received' as const, color: '#a0c4ff', label: 'Diterima' },
  ];

  return (
    <div className={`${PANEL_CLASS} flex min-h-[414px] flex-col justify-between p-6 lg:col-span-8 lg:h-[438px] lg:min-h-0`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-[#1b2a24]">Fulfillment Progress Overview</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 text-[10px] sm:text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7c74]"><span className="h-2.5 w-2.5 rounded-sm bg-[#52b788]" />Progress</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#6b7c74]"><span className="h-2.5 w-2.5 rounded-sm bg-[#a0c4ff]" />Received</span>
          </div>
          <button type="button" className="inline-flex items-center gap-1 rounded-full border border-[#e5eae7] bg-[#f3f6f4] px-3 py-1.5 text-[10px] font-semibold text-[#1b2a24] hover:bg-[#f1f5f3] sm:text-xs">
            7 Hari Terakhir <ChevronDown className="h-3.5 w-3.5 text-[#6b7c74]" />
          </button>
        </div>
      </div>

      <div className="relative mt-8 h-[272px] pl-8 sm:pl-10">
        <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pb-7 text-[10px] text-[#9ca8a2]">
          {[150, 100, 50, 0].map((tick) => (
            <div key={tick} className="flex items-end gap-2"><span className="w-7 translate-y-1 text-right">{tick}</span><span className="h-px flex-1 bg-[#e5eae7]" /></div>
          ))}
        </div>
        <div className="absolute inset-x-2 bottom-7 top-0 flex items-end justify-between gap-1 sm:inset-x-6 sm:gap-2">
          {data.map((point) => (
            <div key={point.day} className="flex h-full flex-1 items-end justify-center gap-0.5 sm:gap-1" aria-label={`Fulfillment ${point.day}`}>
              {stages.map((stage) => (
                <span
                  key={stage.key}
                  title={`${stage.label}: ${point[stage.key]}`}
                  className="w-1.5 rounded-t-sm transition-opacity hover:opacity-75 sm:w-2"
                  style={{ height: `${Math.min((point[stage.key] / chartMax) * 100, 100)}%`, backgroundColor: stage.color }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-2 bottom-0 flex justify-between sm:inset-x-6">
          {data.map((point) => <span key={point.day} className="flex-1 text-center text-[10px] font-bold tracking-wide text-[#9ca8a2]">{point.day}</span>)}
        </div>
      </div>
    </div>
  );
}

function dateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function OperationalCalendar({ schedule }: { schedule: OperationalSchedule }) {
  const [initialYear, initialMonth] = schedule.month.split('-').map(Number);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialYear, initialMonth - 1, 1));
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = new Date(year, monthIndex, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const cells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const compactCalendar = cells.length > 35;

  const changeMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <aside className={`${PANEL_CLASS} flex min-h-[414px] flex-col justify-between p-6 lg:col-span-4 lg:h-[438px] lg:min-h-0`} aria-label="Agenda operasional">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-[#1b2a24]">Agenda Operasional</h2>
          <Link href="/requisitions" className="text-[10px] font-bold text-[#2d6a4f] hover:underline sm:text-xs">Lihat detail</Link>
        </div>
        <div className={`${compactCalendar ? 'mt-3' : 'mt-5'} flex items-center justify-between`}>
          <span className="text-xs font-bold capitalize text-[#1b2a24]">{monthLabel}</span>
          <div className="flex gap-1">
            <button type="button" aria-label="Bulan sebelumnya" onClick={() => changeMonth(-1)} className="grid h-6 w-6 place-items-center rounded-full border border-[#e5eae7] text-[#6b7c74] hover:bg-[#f1f5f3]"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button type="button" aria-label="Bulan berikutnya" onClick={() => changeMonth(1)} className="grid h-6 w-6 place-items-center rounded-full bg-[#2d6a4f] text-white hover:bg-[#22543d]"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className={`${compactCalendar ? 'mt-2 gap-x-1 gap-y-0.5' : 'mt-3 gap-1'} grid grid-cols-7 text-center`}>
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => <span key={day} className="text-[9px] font-semibold text-[#9ca8a2]">{day}</span>)}
          {cells.map((day, index) => {
            if (day === null) return <span key={`empty-${index}`} className={compactCalendar ? 'h-6 w-6' : 'h-7 w-7'} />;
            const key = dateKey(year, monthIndex, day);
            const selected = key === schedule.selectedDate;
            const marked = schedule.markedDates.includes(key);
            return (
              <span key={key} className={`mx-auto grid place-items-center rounded-full text-[10px] font-semibold ${compactCalendar ? 'h-6 w-6' : 'h-7 w-7'} ${selected ? 'bg-[#2d6a4f] text-white shadow-sm' : marked ? 'bg-[#dbeafe] text-[#2d6a4f]' : 'bg-[#f3f6f4] text-[#6b7c74]'}`}>
                {String(day).padStart(2, '0')}
              </span>
            );
          })}
        </div>
      </div>

      <div className={`${compactCalendar ? 'mt-3 pt-3' : 'mt-5 pt-4'} border-t border-[#e5eae7]`}>
        <p className="text-[10px] font-bold text-[#6b7c74]">Agenda Saya</p>
        <div className="mt-2 text-[9px] text-[#9ca8a2]">{schedule.agenda.startTime}</div>
        <Link href={schedule.agenda.href} className={`mt-1.5 flex items-center gap-3 rounded-xl border border-[#b9dfc7] bg-[#eff9f2] transition hover:border-[#8fc9a4] ${compactCalendar ? 'p-2' : 'p-2.5'}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#2d6a4f] shadow-sm"><PackageOpen className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-[10px] text-[#1b2a24]">{schedule.agenda.title}</strong>
            <small className="block truncate text-[8px] text-[#6b7c74]">{schedule.agenda.subtitle}</small>
          </span>
          <span className="shrink-0 text-right">
            <small className="block text-[8px] font-bold text-[#1b2a24]">{schedule.agenda.startTime}–{schedule.agenda.endTime}</small>
            <em className="mt-1 inline-block rounded bg-[#2d6a4f] px-1.5 py-0.5 text-[7px] font-bold not-italic text-white">{schedule.agenda.status}</em>
          </span>
        </Link>
        <div className="mt-1.5 text-[9px] text-[#9ca8a2]">{schedule.agenda.endTime}</div>
      </div>
    </aside>
  );
}

function activityTone(activity: RecentActivity) {
  if (activity.tone === 'success') return { dot: 'bg-[#2d6a4f]', badge: 'bg-[#d8f3dc] text-[#2d6a4f]' };
  if (activity.tone === 'warning') return { dot: 'bg-[#e6a84d]', badge: 'bg-[#fef3c7] text-[#a66710]' };
  return { dot: 'bg-[#7caee8]', badge: 'bg-[#dbeafe] text-[#32669f]' };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="dashboard-skeleton">
      <div className="flex justify-between"><Skeleton className="h-10 w-64 rounded-xl" /><Skeleton className="h-10 w-64 rounded-xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[146px] rounded-[20px]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-12"><Skeleton className="h-[414px] rounded-[20px] lg:col-span-8" /><Skeleton className="h-[414px] rounded-[20px] lg:col-span-4" /></div>
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
      const [summaryResponse, trendResponse] = await Promise.all([getDashboardSummary(activeLocationId), getDashboardTrend()]);
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
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeLocationId]);

  const handleShareReport = async () => {
    const shareData = { title: 'SIGMA Dashboard Overview', text: 'Ringkasan operasional supply chain SIGMA.', url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard?.writeText(shareData.url);
    } catch {
      return;
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error || !summary || !trend) {
    return <ErrorState className={`${PANEL_CLASS} min-h-64`} title="Gagal Memuat Dashboard" message={error || 'Data operasional tidak tersedia.'} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#1b2a24] sm:text-3xl">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void handleShareReport()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e5eae7] bg-white px-4 text-[11px] font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f5f3] sm:text-xs">
            <Share2 className="h-4 w-4 text-[#6b7c74]" /> Bagikan Laporan
          </button>
          <Link href="/requisitions/create" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2d6a4f] px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#22543d] sm:text-xs">
            <Plus className="h-4 w-4" /> Buat Permintaan
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan inventori">
        <MetricCard title="Persediaan Aktif" value={numberFormatter.format(summary.activeInventoryQuantity)} unit="UNIT" href="/inventory?status=ACTIVE" visual="pulse" detail={<><strong className="text-[#2d6a4f]">{numberFormatter.format(summary.activeLotCount)} lot</strong> pada {numberFormatter.format(summary.activeBinCount)} bin di {summary.locationName}</>} />
        <MetricCard title="Penerimaan Berjalan" value={numberFormatter.format(summary.openInboundQuantity)} unit="UNIT" href="/inbound" visual="curve" detail={<><strong className="text-[#2d6a4f]">{numberFormatter.format(summary.openInboundReceiptCount)} dokumen</strong> menuju {summary.locationName}</>} />
        <MetricCard title="Pengiriman Berjalan" value={numberFormatter.format(summary.inProgressShipmentCount)} unit="KIRIMAN" href="/outbound" visual="bars" detail={<><strong className="text-[#2d6a4f]">{numberFormatter.format(summary.inProgressShipmentQuantity)} unit</strong> masih diproses dari {summary.locationName}</>} />
        <MetricCard title="Pending Requisition" value={numberFormatter.format(summary.pendingRequisitionsCount)} unit="REQ" href="/requisitions?status=SUBMITTED" visual="steps" detail={<>Permintaan masih <strong className="text-[#2d6a4f]">menunggu persetujuan</strong></>} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Fulfillment dan agenda">
        <FulfillmentChart data={trend.weeklyFulfillment} />
        <OperationalCalendar schedule={trend.operationalSchedule} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Transaksi dan aktivitas terbaru">
        <div className={`${PANEL_CLASS} p-6 lg:col-span-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-[#2d6a4f]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Riwayat Permintaan</h2></div>
            <Link href="/requisitions" aria-label="Lihat semua permintaan" className="text-[#9ca8a2] hover:text-[#1b2a24]"><MoreHorizontal className="h-4 w-4" /></Link>
          </div>
          <div className="mt-4 space-y-3">
            {trend.recentTransactions.length === 0 ? (
              <p className="rounded-xl bg-[#f8faf9] p-4 text-xs text-[#6b7c74]">Belum ada transaksi terbaru.</p>
            ) : trend.recentTransactions.slice(0, 2).map((transaction) => (
              <Link key={transaction.id} href={transaction.href} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ee] bg-[#f8faf9] p-3 transition hover:bg-[#f1f5f3]">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e5eae7] bg-white text-[#6b7c74]"><PackageOpen className="h-4 w-4" /></span>
                  <span className="min-w-0"><strong className="block truncate text-xs text-[#1b2a24]">{transaction.reference}</strong><small className="block text-[10px] font-bold text-[#1b2a24]">{numberFormatter.format(transaction.quantity)} unit</small></span>
                </span>
                <span className="shrink-0 text-right"><em className="inline-block rounded-full bg-[#d8f3dc] px-2.5 py-1 text-[9px] font-bold not-italic text-[#2d6a4f]">{transaction.status}</em><small className="mt-1 block text-[9px] text-[#9ca8a2]">{dateFormatter.format(new Date(transaction.occurredAt))}</small></span>
              </Link>
            ))}
          </div>
        </div>

        <div className={`${PANEL_CLASS} p-6 lg:col-span-7`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#2d6a4f]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Recent Activity</h2></div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e5eae7] bg-[#f3f6f4] px-3 py-1 text-[10px] font-semibold text-[#1b2a24]">Bulan Ini <ChevronDown className="h-3.5 w-3.5 text-[#6b7c74]" /></span>
          </div>
          <div className="relative mt-4 space-y-4 pl-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-0.5 before:bg-[#e5eae7]">
            {trend.recentActivities.length === 0 ? (
              <p className="text-xs text-[#6b7c74]">Belum ada aktivitas terbaru.</p>
            ) : trend.recentActivities.map((activity) => {
              const tone = activityTone(activity);
              return (
                <Link key={activity.id} href={activity.href} className="relative flex items-center justify-between gap-4">
                  <span className={`absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${tone.dot}`} />
                  <span className="min-w-0"><strong className="block truncate text-xs text-[#1b2a24]">{activity.title}</strong><small className="block text-[10px] text-[#6b7c74]">{dateFormatter.format(new Date(activity.occurredAt))} • <span className="font-semibold text-[#1b2a24]">{new Date(activity.occurredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></small></span>
                  <em className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold not-italic ${tone.badge}`}><Check className="h-3 w-3" />{activity.status}</em>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  ArrowDownToLine,
  ArrowRight,
  Boxes,
  Building2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardCheck,
  Download,
  PackageCheck,
  PackageOpen,
  RefreshCcw,
  Truck,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getInventoryOverview, listInventoryLocations } from './api';
import type { InventoryOverviewData } from './api';
import type { Location } from '@/shared/types/domain';

const PANEL_CLASS = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';
const numberFormatter = new Intl.NumberFormat('id-ID');
const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const chartColors = ['#2d6a4f', '#52b788', '#91b7f7', '#ffcc62'];

function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: unknown): string {
  return numberFormatter.format(safeNumber(value));
}

function formatCurrency(value: unknown): string {
  return currencyFormatter.format(safeNumber(value)).replace(/\s/g, ' ');
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" data-testid="inventory-overview-skeleton">
      <div className="flex justify-between gap-4"><Skeleton className="h-20 w-96 rounded-xl" /><Skeleton className="h-10 w-96 rounded-xl" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[202px] rounded-[20px]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-12"><Skeleton className="h-[480px] rounded-[20px] lg:col-span-7" /><Skeleton className="h-[480px] rounded-[20px] lg:col-span-5" /></div>
    </div>
  );
}

const tooltipStyle = {
  border: '1px solid #e5eae7',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(27,42,36,.1)',
  fontSize: 11,
};

export function InventoryOverview() {
  const { activeLocationId, setActiveLocationId } = useActiveLocation();
  const { locationIds } = useAuth();
  const [data, setData] = useState<InventoryOverviewData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionMenuOpen, setTransactionMenuOpen] = useState(false);
  const transactionMenuRef = useRef<HTMLDivElement>(null);

  const availableLocations = useMemo(
    () => locationIds.length > 0 ? locations.filter((location) => locationIds.includes(location.id)) : locations,
    [locationIds, locations]
  );

  const fetchData = useCallback(async () => {
    if (!activeLocationId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await getInventoryOverview(activeLocationId));
    } catch (fetchError) {
      setData(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat overview inventory');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    let active = true;
    listInventoryLocations()
      .then((items) => { if (active) setLocations(items); })
      .catch(() => { if (active) setLocations([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const requestId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(requestId);
  }, [fetchData]);

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!transactionMenuRef.current?.contains(event.target as Node)) setTransactionMenuOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setTransactionMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeMenu);
    document.addEventListener('keydown', closeWithEscape);
    return () => {
      document.removeEventListener('pointerdown', closeMenu);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, []);

  if (!activeLocationId) return <EmptyState title="Tidak ada lokasi aktif" description="Pilih lokasi aktif untuk melihat overview inventory." />;
  if (loading) return <OverviewSkeleton />;
  if (error || !data) return <ErrorState title="Gagal Memuat Overview Inventory" message={error ?? 'Data inventory tidak tersedia.'} onRetry={fetchData} />;

  const categoryTotal = data.categoryDistribution.reduce((total, item) => total + safeNumber(item.quantity), 0);
  const totalIncoming = data.incomingPipeline.reduce((total, item) => total + safeNumber(item.quantity), 0);
  const activeIncomingChannels = data.incomingPipeline.filter((item) => safeNumber(item.quantity) > 0).length;
  const incomingDocuments = data.incomingPipeline.reduce((total, item) => total + safeNumber(item.count), 0);
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(new Date());
  const kpis = [
    {
      title: 'Menunggu Diterima',
      value: data.metrics.receivingQuantity,
      unit: `unit / ${formatNumber(data.metrics.receivingDocuments)} dokumen`,
      badge: `${formatNumber(data.metrics.receivingDocuments)} Dok Aktif`,
      description: `${formatNumber(data.metrics.receivingProducts)} produk dijadwalkan masuk ke ${data.locationName}.`,
      footer: `${formatNumber(data.metrics.receivingQuantity)} unit belum diterima`,
      action: 'Detail Inbound',
      href: '/inbound',
      icon: Truck,
      iconTone: 'bg-[#dbeafe] text-[#2563eb]',
      badgeTone: 'bg-[#dbeafe] text-[#2563eb]',
      glow: 'bg-blue-100/60',
    },
    {
      title: 'Produk Kedaluwarsa',
      value: data.metrics.expiredProducts,
      unit: 'SKU aktif',
      badge: `${formatNumber(data.metrics.expiredLots)} Batch Alert`,
      description: `Nilai risiko ${formatCurrency(data.metrics.expiredValue)} dari ${formatNumber(data.metrics.expiredQuantity)} unit stok.`,
      footer: `${formatNumber(data.metrics.expiredLots)} batch perlu tindakan`,
      action: 'Review Batch',
      href: '/inventory?status=EXPIRED',
      icon: CalendarX2,
      iconTone: 'bg-[#fee2e2] text-[#dc2626]',
      badgeTone: 'bg-[#fee2e2] text-[#dc2626]',
      glow: 'bg-red-100/60',
    },
    {
      title: 'Permintaan Terbuka',
      value: data.metrics.openStockRequests,
      unit: 'order unit',
      badge: `${safeNumber(data.metrics.fillRate).toFixed(1)}% Fill Rate`,
      description: `${formatNumber(data.metrics.openRequestQuantity)} unit masih berada dalam alur pemenuhan stok.`,
      footer: `${formatNumber(data.requestPipeline.find((item) => item.status === 'PICKING')?.quantity)} unit sedang picking`,
      action: 'Proses Pick',
      href: '/requisitions',
      icon: Boxes,
      iconTone: 'bg-[#d8f3dc] text-[#2d6a4f]',
      badgeTone: 'bg-[#d8f3dc] text-[#2d6a4f]',
      glow: 'bg-emerald-100/60',
    },
    {
      title: 'Menunggu Persetujuan',
      value: data.metrics.awaitingApprovalRequests,
      unit: 'dokumen requisition',
      badge: 'Perlu Otorisasi',
      description: `${formatNumber(data.metrics.awaitingApprovalQuantity)} unit menunggu review dan keputusan approver.`,
      footer: `${formatNumber(data.metrics.awaitingApprovalQuantity)} unit diajukan`,
      action: 'Approve Now',
      href: '/requisitions?status=SUBMITTED',
      icon: ClipboardCheck,
      iconTone: 'bg-[#ede9fe] text-[#7c3aed]',
      badgeTone: 'bg-[#fff1d6] text-[#c77700]',
      glow: 'bg-violet-100/60',
    },
  ];

  function exportOverview() {
    if (!data) return;
    const rows = [
      ['Metrik', 'Nilai'],
      ...kpis.map((item) => [item.title, safeNumber(item.value)]),
      ...data.categoryDistribution.map((item) => [`Kategori: ${item.category}`, safeNumber(item.quantity)]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `inventory-${activeLocationId}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 pb-3">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f5e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2d6a4f]">
              <PackageOpen className="h-3.5 w-3.5" /> / Persediaan &amp; Logistik
            </span>
            <span className="text-[11px] text-[#9ca8a2]">• Sinkronisasi Realtime</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.045em] text-[#1b2a24] sm:text-3xl">Inventory Management</h1>
          <p className="mt-0.5 text-xs text-[#6b7c74] sm:text-sm">Monitoring stok masuk, pemenuhan permintaan unit, dan kontrol masa kedaluwarsa produk.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative inline-flex h-10 min-w-[205px] items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-3 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f8faf9] focus-within:ring-2 focus-within:ring-[#2d6a4f]/25">
            <Building2 className="h-4 w-4 shrink-0 text-[#2d6a4f]" />
            <span className="sr-only">Gudang / Lokasi</span>
            <select
              id="overview-location"
              aria-label="Gudang / Lokasi"
              value={activeLocationId}
              onChange={(event) => setActiveLocationId(event.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent pr-5 outline-none"
            >
              {availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name} ({location.code})</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#9ca8a2]" />
          </label>
          <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-3 text-xs font-semibold text-[#1b2a24] shadow-sm">
            <CalendarDays className="h-4 w-4 text-[#6b7c74]" /> Bulan Ini ({monthLabel})
          </div>
          <button type="button" onClick={exportOverview} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-3.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:border-[#bfd3c7] hover:bg-[#f8faf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]">
            <Download className="h-4 w-4 text-[#6b7c74]" /> Ekspor
          </button>
          <div className="relative" ref={transactionMenuRef}>
            <button type="button" aria-expanded={transactionMenuOpen} aria-haspopup="menu" onClick={() => setTransactionMenuOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#22543d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] focus-visible:ring-offset-2">
              <CirclePlus className="h-4 w-4" /> Tambah Transaksi <ChevronDown className={`h-3.5 w-3.5 transition ${transactionMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {transactionMenuOpen && (
              <div role="menu" className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[#dfe6e2] bg-white p-2 shadow-[0_16px_40px_rgba(27,42,36,.14)]">
                {[
                  { href: '/inbound', label: 'Penerimaan Barang', detail: 'Catat barang dari supplier', icon: ArrowDownToLine },
                  { href: '/outbound/new', label: 'Pengiriman Baru', detail: 'Kirim stok ke unit tujuan', icon: Truck },
                  { href: '/transfers/new', label: 'Transfer Gudang', detail: 'Pindahkan stok antar lokasi', icon: RefreshCcw },
                  { href: '/requisitions/create', label: 'Permintaan Stok', detail: 'Buat requisition unit', icon: ClipboardCheck },
                ].map((item) => {
                  const Icon = item.icon;
                  return <Link role="menuitem" key={item.href} href={item.href} onClick={() => setTransactionMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#f1f5f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e8f5e9] text-[#2d6a4f]"><Icon className="h-4 w-4" /></span><span><strong className="block text-xs text-[#1b2a24]">{item.label}</strong><small className="text-[10px] text-[#6b7c74]">{item.detail}</small></span></Link>;
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indikator inventory">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className={`${PANEL_CLASS} group relative flex min-h-[202px] flex-col justify-between overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(27,42,36,0.08)]`}>
              <div className={`pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full blur-2xl ${item.glow}`} />
              <div className="relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.iconTone}`}><Icon className="h-5 w-5" strokeWidth={1.8} /></span><h2 className="truncate text-xs font-bold text-[#52665d]">{item.title}</h2></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${item.badgeTone}`}>{item.badge}</span>
                </div>
                <div className="mt-5 flex items-baseline gap-2"><strong className={`font-display text-[30px] leading-none tracking-[-0.05em] ${item.title === 'Produk Kedaluwarsa' ? 'text-[#dc2626]' : 'text-[#132820]'}`}>{formatNumber(item.value)}</strong><span className="text-[10px] font-semibold text-[#9ca8a2]">{item.unit}</span></div>
                <p className="mt-2 min-h-8 text-[10px] leading-4 text-[#6b7c74]">{item.description}</p>
              </div>
              <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 text-[10px]"><span className="text-[#6b7c74]">{item.footer}</span><Link href={item.href} className="relative z-10 inline-flex shrink-0 items-center gap-1 font-bold text-[#2d6a4f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f]">{item.action} <ArrowRight className="h-3 w-3" /></Link></div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Visualisasi aliran dan distribusi inventory">
        <article className={`${PANEL_CLASS} flex min-h-[480px] flex-col justify-between p-5 sm:p-6 lg:col-span-7`}>
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2d6a4f]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Visualisasi Stok Masuk (Inbound Inflow)</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Volume unit yang sedang menuju lokasi aktif, dikelompokkan per kanal masuk.</p></div>
              <div className="flex gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe6e2] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold"><i className="h-2 w-2 rounded-full bg-[#2d6a4f]" />Obat/Farmasi</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe6e2] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold"><i className="h-2 w-2 rounded-full bg-[#52b788]" />BMHP/Alkes</span></div>
            </div>
            <div className="mt-5 h-[275px] w-full" role="img" aria-label="Grouped bar chart aliran stok masuk">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomingPipeline} margin={{ top: 8, right: 6, left: -18, bottom: 0 }} barGap={7}>
                  <CartesianGrid vertical={false} stroke="#e8eeea" />
                  <XAxis dataKey="label" axisLine={{ stroke: '#dce4df' }} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 10, fontWeight: 600 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f3f7f5' }} formatter={(value) => [`${formatNumber(value)} unit`]} />
                  <Bar dataKey="pharmacyQuantity" name="Obat/Farmasi" fill="#2d6a4f" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="medicalSupplyQuantity" name="BMHP/Alkes" fill="#52b788" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 border-t border-[#edf1ee] pt-4 sm:grid-cols-3">
            {[['Total Stok Masuk', `${formatNumber(totalIncoming)} Unit`], ['Dokumen Aktif', `${formatNumber(incomingDocuments)} Dokumen`], ['Kanal Aktif', `${formatNumber(activeIncomingChannels)} Kanal`]].map(([label, value]) => <div key={label} className="rounded-xl border border-[#edf1ee] bg-[#f8faf9] px-3 py-3 text-center"><small className="block text-[9px] font-bold uppercase text-[#9ca8a2]">{label}</small><strong className="mt-1 block text-sm text-[#173d2e]">{value}</strong></div>)}
          </div>
        </article>

        <article className={`${PANEL_CLASS} flex min-h-[480px] flex-col p-5 sm:p-6 lg:col-span-5`}>
          <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#52b788]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Distribusi Persediaan per Kategori</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Proporsi quantity stok aktif di {data.locationName}.</p></div><span className="text-lg leading-none text-[#9ca8a2]">•••</span></div>
          {data.categoryDistribution.length === 0 ? <div className="grid flex-1 place-items-center text-center text-xs text-[#6b7c74]">Belum ada stok aktif untuk divisualisasikan.</div> : (
            <>
              <div className="relative mx-auto mt-3 h-[235px] w-full max-w-[300px]" role="img" aria-label="Donut chart distribusi persediaan per kategori">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.categoryDistribution} dataKey="quantity" nameKey="category" innerRadius={70} outerRadius={102} paddingAngle={1} stroke="#ffffff" strokeWidth={2}>{data.categoryDistribution.map((item, index) => <Cell key={item.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(value)} unit`]} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center"><span className="text-center"><small className="block text-[9px] font-bold uppercase text-[#9ca8a2]">Total Unit</small><strong className="font-display block text-2xl tracking-[-0.04em] text-[#1b2a24]">{formatNumber(categoryTotal)}</strong><small className="text-[9px] font-bold text-[#2d6a4f]">Aktif Tersedia</small></span></div>
              </div>
              <div className="mt-auto space-y-3 border-t border-[#edf1ee] pt-4">{data.categoryDistribution.map((item, index) => <div key={item.category} className="flex items-center gap-2 text-[10px]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="min-w-0 flex-1 truncate font-semibold text-[#1b2a24]">{item.category}</span><strong>{formatNumber(item.quantity)} unit</strong><small className="w-9 text-right text-[#9ca8a2]">{categoryTotal > 0 ? Math.round((safeNumber(item.quantity) / categoryTotal) * 100) : 0}%</small></div>)}</div>
            </>
          )}
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Permintaan dan aksi kritis inventory">
        <article className={`${PANEL_CLASS} flex min-h-[400px] flex-col justify-between p-5 sm:p-6 lg:col-span-7`}>
          <div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Visualisasi Permintaan Stok (Demand vs Fulfillment)</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Perbandingan unit diminta dan terealisasi per unit pemohon.</p></div><div className="flex gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe6e2] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold"><i className="h-2 w-2 rounded-full bg-[#2563eb]" />Permintaan</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe6e2] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold"><i className="h-2 w-2 rounded-full bg-[#2d6a4f]" />Terealisasi</span></div></div>
            <div className="mt-5 h-[250px] w-full" role="img" aria-label="Area chart permintaan dibanding fulfillment">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={data.demandFulfillment} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="requestedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient><linearGradient id="fulfilledFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d6a4f" stopOpacity={0.18} /><stop offset="95%" stopColor="#2d6a4f" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8eeea" /><XAxis dataKey="label" axisLine={{ stroke: '#dce4df' }} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 10, fontWeight: 600 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 9 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(value)} unit`]} /><Area type="monotone" dataKey="requested" name="Permintaan" stroke="#2563eb" strokeWidth={2.5} fill="url(#requestedFill)" dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} /><Area type="monotone" dataKey="fulfilled" name="Terealisasi" stroke="#2d6a4f" strokeWidth={2.5} fill="url(#fulfilledFill)" dot={{ r: 3, fill: '#2d6a4f' }} activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-[#edf1ee] pt-4 text-[10px] sm:flex-row sm:items-center"><span className="inline-flex items-center gap-2 text-[#6b7c74]"><CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" /> Fill rate saat ini <strong className="text-[#2d6a4f]">{safeNumber(data.metrics.fillRate).toFixed(1)}%</strong></span><Link href="/requisitions" className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline">Kelola Disposisi Unit <ArrowRight className="h-3 w-3" /></Link></div>
        </article>

        <aside className={`${PANEL_CLASS} flex min-h-[400px] flex-col justify-between p-5 sm:p-6 lg:col-span-5`}>
          <div>
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-[#f59e0b]" /><h2 className="font-display text-base font-bold text-[#1b2a24]">Kontrol Stok &amp; Aksi Kritis</h2></div><span className="rounded-full border border-[#f6d58f] bg-[#fff7e8] px-2 py-1 text-[9px] font-bold text-[#b86b00]">Perlu Tindakan</span></div>
            <p className="mt-2 text-xs text-[#6b7c74]">Item yang memerlukan persetujuan, reorder cepat, atau penanganan batch.</p>
            <div className="mt-4 space-y-2.5">
              {data.criticalActions.length === 0 ? <div className="rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-6 text-center"><PackageCheck className="mx-auto h-7 w-7 text-[#52b788]" /><p className="mt-2 text-xs font-semibold text-[#2d6a4f]">Tidak ada aksi kritis saat ini.</p></div> : data.criticalActions.map((action) => {
                const tone = action.tone === 'danger' ? { box: 'bg-[#fee2e2] text-[#dc2626]', button: 'border-[#fecaca] bg-[#fff1f1] text-[#b91c1c] hover:bg-[#fee2e2]' } : action.tone === 'warning' ? { box: 'bg-[#fff1c9] text-[#d97706]', button: 'border-[#cde2d3] bg-[#eef7f0] text-[#2d6a4f] hover:bg-[#dff0e4]' } : { box: 'bg-[#ede9fe] text-[#7c3aed]', button: 'border-[#ddd6fe] bg-[#f7f4ff] text-[#6d28d9] hover:bg-[#ede9fe]' };
                const Icon = action.kind === 'EXPIRY' ? CalendarX2 : action.kind === 'REORDER' ? RefreshCcw : CheckCircle2;
                return <div key={action.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-3 transition hover:border-[#bfd3c7] hover:bg-white"><div className="flex min-w-0 items-start gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone.box}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[11px] text-[#1b2a24]">{action.title}</strong><small className="mt-0.5 block text-[9px] leading-4 text-[#6b7c74]">{action.description}</small></span></div><Link href={action.href} className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${tone.button}`}>{action.actionLabel}</Link></div>;
              })}
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf1ee] pt-4 text-[10px]"><span className="text-[#9ca8a2]">Audit opname: mengikuti lokasi aktif</span><Link href="/inventory?view=details" className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline">Lihat Semua Alert <ArrowRight className="h-3 w-3" /></Link></div>
        </aside>
      </section>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertOctagon,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardCheck,
  Clock4,
  Download,
  History,
  Layers3,
  PackageMinus,
  PackagePlus,
  RefreshCcw,
  Repeat2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
import {
  getTransactionOverview,
  listTransactionLocations,
  type TransactionOverviewData,
  type TransactionOverviewPeriod,
  type TransactionOverviewStatus,
  type TransactionOverviewType,
} from './api';
import type { Location } from '@/shared/types/domain';

const PANEL = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';
const distributionColors = ['#2563eb', '#2d6a4f', '#ffd166', '#7c3aed'];
const formatter = new Intl.NumberFormat('id-ID');
const tooltipStyle = { border: '1px solid #e5eae7', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,42,36,.1)', fontSize: 11 };

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value: unknown) {
  return formatter.format(safeNumber(value));
}

function TransactionSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-14 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-[20px]" />)}</div><div className="grid gap-6 lg:grid-cols-12"><Skeleton className="h-[450px] rounded-[20px] lg:col-span-7" /><Skeleton className="h-[450px] rounded-[20px] lg:col-span-5" /></div></div>;
}

const typeTone = {
  INBOUND: 'border-emerald-200 bg-emerald-50 text-[#2d6a4f]',
  OUTBOUND: 'border-blue-200 bg-blue-50 text-[#2563eb]',
  TRANSFER: 'border-amber-200 bg-amber-50 text-[#a16207]',
  ADJUSTMENT: 'border-violet-200 bg-violet-50 text-[#7c3aed]',
};

const statusTone: Record<string, string> = {
  COMPLETED: 'bg-[#d8f3dc] text-[#2d6a4f]',
  RECEIVED: 'bg-[#d8f3dc] text-[#2d6a4f]',
  DISPATCHED: 'bg-blue-100 text-[#2563eb]',
  ISSUED: 'bg-blue-100 text-[#2563eb]',
  SUBMITTED: 'bg-violet-100 text-[#7c3aed]',
  APPROVED: 'bg-violet-100 text-[#7c3aed]',
};

export function TransactionManagement() {
  const { activeLocationId, setActiveLocationId } = useActiveLocation();
  const { locationIds } = useAuth();
  const [data, setData] = useState<TransactionOverviewData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [period, setPeriod] = useState<TransactionOverviewPeriod>('30D');
  const [type, setType] = useState<TransactionOverviewType>('ALL');
  const [status, setStatus] = useState<TransactionOverviewStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const availableLocations = useMemo(
    () => locationIds.length ? locations.filter((location) => locationIds.includes(location.id)) : locations,
    [locationIds, locations]
  );

  const fetchData = useCallback(async () => {
    if (!activeLocationId) { setLoading(false); setData(null); return; }
    setLoading(true);
    setError(null);
    try {
      setData(await getTransactionOverview({ locationId: activeLocationId, period, type, status }));
    } catch (fetchError) {
      setData(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId, period, status, type]);

  useEffect(() => {
    let active = true;
    listTransactionLocations().then((items) => { if (active) setLocations(items); }).catch(() => { if (active) setLocations([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);

  if (!activeLocationId) return <EmptyState title="Tidak ada lokasi aktif" description="Pilih lokasi untuk membuka visualisasi transaksi." />;
  if (loading) return <TransactionSkeleton />;
  if (error || !data) return <ErrorState title="Gagal Memuat Transaction Management" message={error ?? 'Data transaksi tidak tersedia.'} onRetry={fetchData} />;

  const distributionTotal = data.distribution.reduce((total, item) => total + safeNumber(item.value), 0);
  const processing = data.pipeline.find((item) => item.key === 'processing')?.value ?? 0;
  const transit = data.pipeline.find((item) => item.key === 'transit')?.value ?? 0;
  const kpis = [
    { title: 'Total Transaksi', value: data.metrics.totalDocuments, unit: 'dokumen', badge: 'Periode Aktif', description: `Inbound (${data.metrics.inboundDocuments}) • Outbound (${data.metrics.outboundDocuments}) • Transfer (${data.totalsByType.TRANSFER}) • Adj (${data.totalsByType.ADJUSTMENT})`, footer: `${safeNumber(data.metrics.completionRate).toFixed(1)}% tingkat penyelesaian`, action: 'Daftar Terfilter', href: '#transaction-ledger', icon: Layers3, iconTone: 'bg-[#d8f3dc] text-[#2d6a4f]', badgeTone: 'bg-[#d8f3dc] text-[#2d6a4f]', valueTone: 'text-[#1b2a24]' },
    { title: 'Barang Masuk', value: data.metrics.inboundUnits, unit: 'total unit', badge: `${data.metrics.inboundDocuments} Dokumen`, description: `${data.metrics.inboundCompleted} dokumen selesai • ${Math.max(data.metrics.inboundDocuments - data.metrics.inboundCompleted, 0)} masih diproses`, footer: `${data.metrics.inboundDocuments} receipt pada lokasi aktif`, action: 'Ke Inbound', href: '/inbound', icon: PackagePlus, iconTone: 'bg-[#d8f3dc] text-[#2d6a4f]', badgeTone: 'bg-[#d8f3dc] text-[#2d6a4f]', valueTone: 'text-[#2d6a4f]' },
    { title: 'Barang Keluar', value: data.metrics.outboundUnits, unit: 'unit terdistribusi', badge: 'Fulfillment', description: `${data.metrics.outboundCompleted} selesai • ${Math.max(data.metrics.outboundDocuments - data.metrics.outboundCompleted, 0)} dokumen aktif`, footer: `${data.metrics.outboundDocuments} shipment & requisition`, action: 'Ke Outbound', href: '/outbound', icon: PackageMinus, iconTone: 'bg-blue-100 text-[#2563eb]', badgeTone: 'bg-blue-100 text-[#2563eb]', valueTone: 'text-[#2563eb]' },
    { title: 'Transaksi Diproses', value: data.metrics.workInProgress, unit: 'dokumen WIP', badge: `${data.metrics.actionRequired} Butuh Aksi`, description: `Receiving/Picking (${processing}) • Transit (${transit})`, footer: 'Pantau dokumen sampai selesai', action: 'Aksi Kritis', href: '#critical-actions', icon: Clock4, iconTone: 'bg-amber-100 text-[#d97706]', badgeTone: 'bg-red-100 text-[#dc2626]', valueTone: 'text-[#b86b00]' },
  ];

  function resetFilters() {
    setPeriod('30D'); setType('ALL'); setStatus('ALL');
  }

  function exportLedger() {
    if (!data) return;
    const header = ['Nomor Dokumen', 'Jenis', 'Asal', 'Tujuan', 'Produk', 'Lot', 'Jumlah', 'Status', 'Tanggal', 'PIC'];
    const rows = data.recentTransactions.map((item) => [item.reference, item.typeLabel, item.origin, item.destination, item.productSummary, item.lotSummary, item.quantity, item.status, item.createdAt, item.pic]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `transaction-ledger-${activeLocationId}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="space-y-6 pb-3">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
      <div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-md bg-[#e8f5e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2d6a4f]"><Repeat2 className="h-3.5 w-3.5" /> / Manajemen Transaksi &amp; Mutasi</span><span className="text-[11px] text-[#9ca8a2]">• Live Audit Trail &amp; Ledger Sinkron</span></div><h1 className="font-display text-2xl font-bold tracking-[-0.045em] text-[#1b2a24] sm:text-3xl">Transaction Management</h1><p className="mt-0.5 max-w-3xl text-xs text-[#6b7c74] sm:text-sm">Monitoring arus pergerakan unit, throughput penerimaan dan pengeluaran, serta transaksi yang membutuhkan tindakan.</p></div>
      <div className="flex flex-wrap items-center gap-2.5"><button type="button" onClick={exportLedger} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-3.5 text-xs font-semibold shadow-sm transition hover:bg-[#f8faf9]"><Download className="h-4 w-4 text-[#6b7c74]" /> Ekspor Ledger</button><div className="relative" ref={menuRef}><button type="button" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#22543d]"><CirclePlus className="h-4 w-4" /> Tambah Transaksi <ChevronDown className={`h-3.5 w-3.5 transition ${menuOpen ? 'rotate-180' : ''}`} /></button>{menuOpen && <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-[#dfe6e2] bg-white p-2 shadow-[0_16px_40px_rgba(27,42,36,.14)]">{[
        { href: '/inbound', label: 'Penerimaan Inbound', detail: 'Penerimaan supplier & QC', icon: PackagePlus, tone: 'bg-emerald-100 text-[#2d6a4f]' },
        { href: '/outbound/new', label: 'Pengeluaran Outbound', detail: 'Distribusi ke unit tujuan', icon: PackageMinus, tone: 'bg-blue-100 text-[#2563eb]' },
        { href: '/transfers/new', label: 'Transfer Antar Gudang', detail: 'Mutasi antar lokasi', icon: ArrowLeftRight, tone: 'bg-amber-100 text-[#a16207]' },
        { href: '/cycle-count', label: 'Penyesuaian Opname', detail: 'Rekonsiliasi fisik & sistem', icon: ClipboardCheck, tone: 'bg-violet-100 text-[#7c3aed]' },
      ].map((item) => { const Icon = item.icon; return <Link role="menuitem" key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-[#f1f5f3]"><span className={`grid h-8 w-8 place-items-center rounded-lg ${item.tone}`}><Icon className="h-4 w-4" /></span><span><strong className="block text-[11px] text-[#1b2a24]">{item.label}</strong><small className="text-[9px] text-[#6b7c74]">{item.detail}</small></span></Link>; })}</div>}</div></div>
    </header>

    <section className={`${PANEL} flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3`} aria-label="Filter transaksi"><div className="flex min-w-0 flex-1 flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 px-1 text-xs font-bold text-[#9ca8a2]"><SlidersHorizontal className="h-3.5 w-3.5 text-[#2d6a4f]" />Filter:</span>
      <label className="relative inline-flex h-9 min-w-[205px] items-center gap-2 rounded-xl border border-[#e5eae7] bg-[#f3f6f4] pl-3 pr-8 text-[11px] font-semibold"><Building2 className="h-3.5 w-3.5 text-[#6b7c74]" /><span className="sr-only">Gudang / Lokasi Transaksi</span><select aria-label="Gudang / Lokasi Transaksi" value={activeLocationId} onChange={(event) => setActiveLocationId(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent outline-none">{availableLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-[#9ca8a2]" /></label>
      <FilterSelect icon={CalendarDays} label="Rentang waktu" value={period} onChange={(value) => setPeriod(value as TransactionOverviewPeriod)} options={[['TODAY','Hari Ini (Real-time)'],['7D','7 Hari Terakhir'],['30D','Bulan Aktif (30 Hari)'],['ALL','Semua Periode']]} />
      <FilterSelect icon={Repeat2} label="Jenis transaksi" value={type} onChange={(value) => setType(value as TransactionOverviewType)} options={[['ALL','Semua Jenis Mutasi'],['INBOUND','Inbound'],['OUTBOUND','Outbound'],['TRANSFER','Transfer'],['ADJUSTMENT','Adjustment / Opname']]} />
      <FilterSelect icon={CheckCircle2} label="Status transaksi" value={status} onChange={(value) => setStatus(value as TransactionOverviewStatus)} options={[['ALL','Semua Status Dokumen'],['COMPLETED','Completed'],['IN_PROGRESS','Sedang Diproses'],['DISPATCHED','Dispatched / Transit'],['ACTION_REQUIRED','Perlu Tindakan']]} />
    </div><button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#6b7c74] hover:text-[#2d6a4f]"><RefreshCcw className="h-3 w-3" /> Reset Filter</button></section>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="KPI transaksi">{kpis.map((item) => { const Icon = item.icon; return <article key={item.title} className={`${PANEL} group relative flex min-h-[192px] flex-col justify-between overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(27,42,36,.08)]`}><div><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><i className={`grid h-9 w-9 place-items-center rounded-xl not-italic ${item.iconTone}`}><Icon className="h-5 w-5" /></i><strong className="text-xs text-[#52665d]">{item.title}</strong></span><small className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.badgeTone}`}>{item.badge}</small></div><div className="mt-5 flex items-baseline gap-2"><strong className={`font-display text-[30px] leading-none tracking-[-.05em] ${item.valueTone}`}>{formatNumber(item.value)}</strong><span className="text-[10px] font-semibold text-[#9ca8a2]">{item.unit}</span></div><p className="mt-2 text-[10px] leading-4 text-[#6b7c74]">{item.description}</p></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 text-[10px]"><span className="text-[#6b7c74]">{item.footer}</span><Link href={item.href} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#2d6a4f] hover:underline">{item.action}<ArrowRight className="h-3 w-3" /></Link></div></article>; })}</section>

    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Arus dan distribusi transaksi">
      <article className={`${PANEL} min-h-[440px] p-5 sm:p-6 lg:col-span-7`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2d6a4f]" /><h2 className="font-display text-base font-bold">Arus Barang Masuk vs Keluar</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Perbandingan unit yang sudah diposting ke ledger selama tujuh hari terakhir.</p></div><ChartLegend items={[['#2d6a4f','Inbound'],['#2563eb','Outbound']]} /></div><div className="mt-5 h-[285px]" role="img" aria-label="Grouped bar chart arus barang masuk dan keluar"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.flowTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={6}><CartesianGrid vertical={false} stroke="#e8eeea" /><XAxis dataKey="label" axisLine={{ stroke: '#dce4df' }} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 10 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 9 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(value)} unit`]} /><Bar dataKey="inbound" name="Inbound" fill="#2d6a4f" radius={[6,6,0,0]} maxBarSize={34} /><Bar dataKey="outbound" name="Outbound" fill="#2563eb" radius={[6,6,0,0]} maxBarSize={34} /></BarChart></ResponsiveContainer></div><div className="mt-3 flex flex-col justify-between gap-2 border-t border-[#edf1ee] pt-4 text-[10px] sm:flex-row"><span className="text-[#6b7c74]">Volume hanya menghitung quantity yang telah diposting.</span><strong className="text-[#2d6a4f]">Net flow: {formatNumber(data.metrics.inboundUnits - data.metrics.outboundUnits)} unit</strong></div></article>
      <article className={`${PANEL} flex min-h-[440px] flex-col p-5 sm:p-6 lg:col-span-5`}><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#52b788]" /><h2 className="font-display text-base font-bold">Distribusi Jenis Transaksi</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Proporsi dokumen transaksi pada filter aktif.</p></div><div className="relative mx-auto h-[230px] w-full max-w-[300px]" role="img" aria-label="Donut chart distribusi jenis transaksi"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.distribution} dataKey="value" nameKey="label" innerRadius={68} outerRadius={98} paddingAngle={1} stroke="#fff" strokeWidth={2}>{data.distribution.map((item,index) => <Cell key={item.type} fill={distributionColors[index]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(value)} transaksi`]} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><span><small className="block text-[9px] font-bold uppercase text-[#9ca8a2]">Total Transaksi</small><strong className="font-display block text-2xl">{formatNumber(distributionTotal)}</strong><small className="text-[9px] font-bold text-[#2d6a4f]">Dokumen Aktif</small></span></div></div><div className="mt-auto space-y-3 border-t border-[#edf1ee] pt-4">{data.distribution.map((item,index) => <div key={item.type} className="flex items-center gap-2 text-[10px]"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: distributionColors[index] }} /><span className="min-w-0 flex-1 truncate font-semibold">{item.label}</span><strong>{formatNumber(item.value)} TRX</strong><small className="w-9 text-right text-[#9ca8a2]">{distributionTotal ? Math.round(item.value / distributionTotal * 100) : 0}%</small></div>)}</div></article>
    </section>

    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Throughput dan aksi kritis transaksi">
      <article className={`${PANEL} min-h-[440px] p-5 sm:p-6 lg:col-span-7`}><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" /><h2 className="font-display text-base font-bold">Transaction Throughput &amp; Penyelesaian</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Dokumen dibuat, selesai, dan completion rate per hari.</p></div><ChartLegend items={[['#2563eb','Dibuat'],['#2d6a4f','Selesai'],['#7c3aed','% Completion']]} /></div><div className="mt-4 h-[220px]" role="img" aria-label="Mixed chart throughput transaksi"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.throughputTrend} margin={{ top: 8, right: -2, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#e8eeea" /><XAxis dataKey="label" axisLine={{ stroke: '#dce4df' }} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 10 }} /><YAxis yAxisId="documents" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7c74', fontSize: 9 }} /><YAxis yAxisId="rate" orientation="right" domain={[0,100]} hide /><Tooltip contentStyle={tooltipStyle} /><Bar yAxisId="documents" dataKey="created" name="Dibuat" fill="#a0c4ff" radius={[5,5,0,0]} maxBarSize={24} /><Bar yAxisId="documents" dataKey="completed" name="Selesai" fill="#2d6a4f" radius={[5,5,0,0]} maxBarSize={24} /><Area yAxisId="rate" type="monotone" dataKey="completionRate" name="Completion %" stroke="#7c3aed" strokeWidth={2} fill="#ede9fe" fillOpacity={0.35} /><Line yAxisId="rate" type="monotone" dataKey="completionRate" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div><div className="mt-3 border-t border-[#edf1ee] pt-4"><div className="mb-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wide text-[#9ca8a2]"><span>Status Pipeline Transaksi Aktif</span><span className="text-[#2d6a4f]">Tingkat selesai: {safeNumber(data.metrics.completionRate).toFixed(1)}%</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{data.pipeline.map((item,index) => { const tone = item.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-[#2d6a4f]' : item.tone === 'info' ? 'border-blue-200 bg-blue-50 text-[#2563eb]' : item.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-[#a16207]' : 'border-[#e5eae7] bg-[#f8faf9] text-[#6b7c74]'; return <div key={item.key} className={`flex items-center gap-2 rounded-xl border p-2.5 ${tone}`}><i className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 text-[10px] font-bold not-italic">{index+1}</i><span><strong className="block text-[11px]">{formatNumber(item.value)} Dokumen</strong><small className="text-[9px]">{item.label}</small></span></div>; })}</div></div></article>
      <aside id="critical-actions" className={`${PANEL} flex min-h-[440px] flex-col justify-between p-5 sm:p-6 lg:col-span-5`}><div><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-red-500" /><h2 className="font-display text-base font-bold">Transaksi &amp; Aksi Kritis</h2></div><span className="rounded-full border border-red-200 bg-red-100 px-2 py-1 text-[9px] font-bold text-red-700">{data.metrics.actionRequired} Perlu Tindakan</span></div><p className="mt-2 text-xs text-[#6b7c74]">Dokumen tertunda atau belum mencapai status selesai.</p><div className="mt-4 space-y-2.5">{data.criticalActions.length ? data.criticalActions.map((action) => { const tone = action.tone === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : action.tone === 'info' ? 'border-blue-200 bg-blue-50 text-blue-700' : action.tone === 'purple' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-amber-200 bg-amber-50 text-amber-700'; return <div key={action.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-3 transition hover:border-[#bfd3c7]"><span className="min-w-0"><strong className="block truncate text-[11px]">{action.title}</strong><small className="mt-0.5 block text-[9px] leading-4 text-[#6b7c74]">{action.description}</small></span><Link href={action.href} className={`shrink-0 rounded-lg border px-2.5 py-1 text-[9px] font-bold ${tone}`}>{action.actionLabel}</Link></div>; }) : <div className="rounded-xl bg-[#f8faf9] p-6 text-center text-xs text-[#2d6a4f]">Semua transaksi pada filter aktif telah selesai.</div>}</div></div><div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-4 text-[10px]"><span className="text-[#9ca8a2]">Audit mengikuti lokasi dan periode aktif</span><Link href="/reports?type=transactions" className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline">Buka Laporan <ArrowRight className="h-3 w-3" /></Link></div></aside>
    </section>

    <section id="transaction-ledger" className={`${PANEL} space-y-4 p-5 sm:p-6`} aria-label="Aktivitas transaksi terbaru"><div className="flex flex-col justify-between gap-4 border-b border-[#e5eae7] pb-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><History className="h-4 w-4 text-[#2d6a4f]" /><h2 className="font-display text-base font-bold">Aktivitas Transaksi Terbaru</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Audit dokumen, asal-tujuan, quantity, status, waktu, dan PIC.</p></div><div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">{([['ALL','Semua'],['INBOUND','Inbound'],['OUTBOUND','Outbound'],['TRANSFER','Transfer'],['ADJUSTMENT','Adjustment']] as Array<[TransactionOverviewType,string]>).map(([value,label]) => <button type="button" key={value} onClick={() => setType(value)} className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold transition ${type === value ? 'border-[#b9d6c3] bg-[#e8f5e9] text-[#2d6a4f]' : 'border-[#e5eae7] text-[#6b7c74] hover:bg-[#f1f5f3]'}`}>{label} ({value === 'ALL' ? data.metrics.totalDocuments : data.totalsByType[value]})</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-[10px]"><thead><tr className="border-b border-[#e5eae7] text-[9px] font-bold uppercase tracking-wide text-[#9ca8a2]"><th className="px-3 py-3">Nomor Dokumen</th><th className="px-3 py-3">Jenis Transaksi</th><th className="px-3 py-3">Gudang Asal → Tujuan</th><th className="px-3 py-3">Produk &amp; Lot</th><th className="px-3 py-3 text-right">Jumlah</th><th className="px-3 py-3 text-center">Status</th><th className="px-3 py-3">Waktu</th><th className="px-3 py-3">PIC</th><th className="px-3 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-[#edf1ee]">{data.recentTransactions.map((item) => <tr key={item.id} className="transition hover:bg-[#f8faf9]"><td className="px-3 py-3"><strong className="block text-[11px]">{item.reference}</strong><small className="text-[#9ca8a2]">{item.secondaryReference ?? item.id}</small></td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-bold ${typeTone[item.type]}`}>{item.type === 'INBOUND' ? <ArrowDownLeft className="h-3 w-3" /> : item.type === 'OUTBOUND' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowLeftRight className="h-3 w-3" />}{item.typeLabel}</span></td><td className="px-3 py-3"><strong className="block font-semibold">{item.origin}</strong><small className="text-[#9ca8a2]">→ {item.destination}</small></td><td className="max-w-56 px-3 py-3"><strong className="block truncate font-semibold">{item.productSummary}</strong><small className="block truncate text-[#9ca8a2]">{item.lotSummary}</small></td><td className="px-3 py-3 text-right font-bold text-[#2d6a4f]">{formatNumber(item.quantity)} unit</td><td className="px-3 py-3 text-center"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusTone[item.status] ?? 'bg-amber-100 text-amber-700'}`}>{item.status}</span></td><td className="px-3 py-3 text-[#6b7c74]">{new Intl.DateTimeFormat('id-ID',{ dateStyle:'medium', timeStyle:'short' }).format(new Date(item.createdAt))}</td><td className="px-3 py-3 font-semibold">{item.pic}</td><td className="px-3 py-3 text-center"><Link href={item.href} className="rounded-lg border border-[#dfe6e2] px-2.5 py-1 font-bold text-[#2d6a4f] hover:bg-[#e8f5e9]">Detail</Link></td></tr>)}</tbody></table>{data.recentTransactions.length === 0 && <div className="py-10 text-center text-xs text-[#9ca8a2]">Tidak ada transaksi yang cocok dengan filter.</div>}</div><div className="border-t border-[#edf1ee] pt-3 text-[10px] text-[#9ca8a2]">Menampilkan {data.recentTransactions.length} dari {data.metrics.totalDocuments} transaksi pada filter aktif.</div></section>
  </div>;
}

function FilterSelect({ icon: Icon, label, value, onChange, options }: { icon: typeof CalendarDays; label: string; value: string; onChange: (value: string) => void; options: Array<[string,string]> }) {
  return <label className="relative inline-flex h-9 min-w-[165px] items-center gap-2 rounded-xl border border-[#e5eae7] bg-[#f3f6f4] pl-3 pr-8 text-[11px] font-semibold"><Icon className="h-3.5 w-3.5 text-[#6b7c74]" /><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent outline-none">{options.map(([optionValue,optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-[#9ca8a2]" /></label>;
}

function ChartLegend({ items }: { items: Array<[string,string]> }) {
  return <div className="flex flex-wrap gap-2">{items.map(([color,label]) => <span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2.5 py-1 text-[9px] font-semibold"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}</div>;
}

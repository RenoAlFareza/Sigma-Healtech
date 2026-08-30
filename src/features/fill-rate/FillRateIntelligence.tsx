'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  ClipboardList,
  Download,
  Flame,
  Grid2X2,
  Package,
  PackageX,
  Percent,
  RefreshCcw,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import {
  getFillRate,
  listFillRateLocations,
  type FillRateData,
  type FillRatePeriod,
  type FillRatePriority,
  type FillRateStatus,
  type FillRateThreshold,
} from './api';
import type { Location } from '@/shared/types/domain';

const PANEL = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';
const formatter = new Intl.NumberFormat('id-ID');
const tooltipStyle = { border: '1px solid #e5eae7', borderRadius: 12, boxShadow: '0 8px 24px rgba(27,42,36,.1)', fontSize: 11 };

function safeNumber(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function formatNumber(value: unknown) { return formatter.format(safeNumber(value)); }

function FillRateSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-[20px]" />)}</div><div className="grid gap-6 lg:grid-cols-12"><Skeleton className="h-[450px] rounded-[20px] lg:col-span-7" /><Skeleton className="h-[450px] rounded-[20px] lg:col-span-5" /></div></div>;
}

export function FillRateIntelligence() {
  const { activeLocationId, setActiveLocationId } = useActiveLocation();
  const { locationIds } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [data, setData] = useState<FillRateData | null>(null);
  const [period, setPeriod] = useState<FillRatePeriod>('30D');
  const [unit, setUnit] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [priority, setPriority] = useState<FillRatePriority>('ALL');
  const [status, setStatus] = useState<FillRateStatus>('ALL');
  const [threshold, setThreshold] = useState<FillRateThreshold>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableLocations = useMemo(() => locationIds.length ? locations.filter((location) => locationIds.includes(location.id)) : locations, [locationIds, locations]);
  const fetchData = useCallback(async () => {
    if (!activeLocationId) { setLoading(false); setData(null); return; }
    setLoading(true); setError(null);
    try { setData(await getFillRate({ locationId: activeLocationId, period, unit, category, priority, status, threshold })); }
    catch (fetchError) { setData(null); setError(fetchError instanceof Error ? fetchError.message : 'Gagal memuat fill rate'); }
    finally { setLoading(false); }
  }, [activeLocationId, category, period, priority, status, threshold, unit]);

  useEffect(() => { let active = true; listFillRateLocations().then((items) => { if (active) setLocations(items); }).catch(() => { if (active) setLocations([]); }); return () => { active = false; }; }, []);
  useEffect(() => { const timer = window.setTimeout(() => void fetchData(), 0); return () => window.clearTimeout(timer); }, [fetchData]);

  if (!activeLocationId) return <EmptyState title="Tidak ada gudang pemenuh" description="Pilih lokasi untuk membuka Fill Rate Intelligence." />;
  if (loading) return <FillRateSkeleton />;
  if (error || !data) return <ErrorState title="Gagal Memuat Fill Rate Intelligence" message={error ?? 'Data fill rate tidak tersedia.'} onRetry={fetchData} />;

  const kpis = [
    { title: 'Overall Fill Rate', value: `${safeNumber(data.metrics.overallFillRate).toFixed(1)}%`, badge: `Target ≥${data.target}%`, description: `${formatNumber(data.metrics.issuedUnits)} unit dikeluarkan dari ${formatNumber(data.metrics.requestedUnits)} diminta`, footer: 'Rumus: Issued ÷ Requested × 100', action: 'Rincian', href: '#fill-rate-ledger', icon: Percent, iconTone: 'bg-[#d8f3dc] text-[#2d6a4f]', badgeTone: 'bg-[#d8f3dc] text-[#2d6a4f]', valueTone: 'text-[#2d6a4f]' },
    { title: 'Complete Order Rate', value: `${safeNumber(data.metrics.completeOrderRate).toFixed(1)}%`, badge: 'Zero Shortage', description: `${data.metrics.completeOrders} dokumen complete • ${data.metrics.partialOrders} partial`, footer: `Total ${data.metrics.totalOrders} dokumen`, action: 'Lihat Complete', href: '#fill-rate-ledger', icon: CheckCheck, iconTone: 'bg-blue-100 text-[#2563eb]', badgeTone: 'bg-blue-100 text-[#2563eb]', valueTone: 'text-[#2563eb]' },
    { title: 'Unfulfilled Demand', value: formatNumber(data.metrics.unfulfilledUnits), badge: 'Gap Quantity', description: `${data.metrics.requestedUnits > 0 ? (data.metrics.unfulfilledUnits / data.metrics.requestedUnits * 100).toFixed(1) : '0.0'}% dari permintaan pada filter aktif`, footer: `${data.criticalGaps.length} baris membutuhkan tindakan`, action: 'Review Gap', href: '#critical-fulfillment', icon: PackageX, iconTone: 'bg-amber-100 text-[#d97706]', badgeTone: 'bg-amber-100 text-[#a16207]', valueTone: 'text-[#b86b00]', unit: 'unit backorder' },
    { title: 'Urgent Request at Risk', value: formatNumber(data.metrics.urgentAtRisk), badge: 'Kritis / Cito', description: 'Requisition URGENT dengan quantity yang belum seluruhnya issued', footer: 'Prioritaskan approval dan alokasi stok', action: 'Proses Urgent', href: '/requisitions?priority=URGENT', icon: Flame, iconTone: 'bg-red-100 text-[#dc2626]', badgeTone: 'bg-red-100 text-[#dc2626]', valueTone: 'text-[#dc2626]', unit: 'order berisiko' },
  ];

  function resetFilters() { setPeriod('30D'); setUnit('ALL'); setCategory('ALL'); setPriority('ALL'); setStatus('ALL'); setThreshold('ALL'); }
  function exportAudit() {
    if (!data) return;
    const rows = [['Requisition','Unit','Prioritas','Produk','Requested','Approved','Issued','Gap','Fill Rate','Status'], ...data.details.map((row) => [row.requestNumber,row.unitName,row.priority,row.productName,row.requested,row.approved,row.issued,row.gap,row.fillRate.toFixed(1),row.fulfillmentStatus])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `fill-rate-${activeLocationId}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="space-y-6 pb-3">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><div className="mb-1 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 rounded-md bg-[#e8f5e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2d6a4f]"><TrendingUp className="h-3.5 w-3.5" /> / Intelijen Pemenuhan Stok &amp; Requisition</span><span className="text-[11px] text-[#9ca8a2]">• Target Service Level ≥ {data.target}%</span></div><h1 className="font-display text-2xl font-bold tracking-[-0.045em] text-[#1b2a24] sm:text-3xl">Fill Rate Intelligence</h1><p className="mt-0.5 max-w-3xl text-xs text-[#6b7c74] sm:text-sm">Analisis requested, approved, issued, gap quantity, dan requisition kritis berdasarkan data fulfillment aktual.</p></div><div className="flex flex-wrap gap-2.5"><button type="button" onClick={exportAudit} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-3.5 text-xs font-semibold shadow-sm hover:bg-[#f8faf9]"><Download className="h-4 w-4 text-[#6b7c74]" /> Ekspor Audit Fill Rate</button><Link href="/requisitions/create" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#22543d]"><CirclePlus className="h-4 w-4" /> Buat Requisition Baru</Link></div></header>

    <section className={`${PANEL} space-y-2.5 rounded-2xl p-3`} aria-label="Parameter filter fill rate"><div className="flex items-center justify-between gap-2 border-b border-[#edf1ee] pb-2"><span className="inline-flex items-center gap-1.5 px-1 text-[11px] font-bold text-[#9ca8a2]"><SlidersHorizontal className="h-3.5 w-3.5 text-[#2d6a4f]" />Parameter Filter Pemenuhan:</span><button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6b7c74] hover:text-[#2d6a4f]"><RefreshCcw className="h-3 w-3" /> Reset Semua Filter</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
      <FilterSelect label="Gudang Pemenuh" icon={Building2} value={activeLocationId} onChange={setActiveLocationId} options={availableLocations.map((location) => [location.id, location.name])} />
      <FilterSelect label="Periode" icon={CalendarDays} value={period} onChange={(value) => setPeriod(value as FillRatePeriod)} options={[['7D','7 Hari Terakhir'],['30D','Bulan Aktif (30 Hari)'],['ALL','Semua Periode']]} />
      <FilterSelect label="Unit Pemohon" icon={Grid2X2} value={unit} onChange={setUnit} options={[['ALL','Semua Unit'],...data.filterOptions.units.map((item) => [item.value,item.label] as [string,string])]} />
      <FilterSelect label="Kategori KFA" icon={Package} value={category} onChange={setCategory} options={[['ALL','Semua Kategori'],...data.filterOptions.categories.map((item) => [item,item] as [string,string])]} />
      <FilterSelect label="Prioritas" icon={Flame} value={priority} onChange={(value) => setPriority(value as FillRatePriority)} options={[['ALL','Semua Prioritas'],['URGENT','URGENT / Cito'],['RUTIN','RUTIN']]} />
      <FilterSelect label="Status Pemenuhan" icon={CheckCircle2} value={status} onChange={(value) => setStatus(value as FillRateStatus)} options={[['ALL','Semua Status'],['COMPLETE','100% Complete'],['PARTIAL','Partial'],['STOCKOUT','Stockout'],['PENDING','Waiting Picking']]} />
      <FilterSelect label="Ambang Fill Rate" icon={Percent} value={threshold} onChange={(value) => setThreshold(value as FillRateThreshold)} options={[['ALL','Semua Ambang'],['UNDER_80','< 80% Kritis'],['80_95','80% - 95%'],['OVER_95','≥ 95%']]} />
    </div></section>

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="KPI fill rate">{kpis.map((item) => { const Icon = item.icon; return <article key={item.title} className={`${PANEL} flex min-h-[192px] flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(27,42,36,.08)]`}><div><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><i className={`grid h-9 w-9 place-items-center rounded-xl not-italic ${item.iconTone}`}><Icon className="h-5 w-5" /></i><strong className="text-xs text-[#52665d]">{item.title}</strong></span><small className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.badgeTone}`}>{item.badge}</small></div><div className="mt-5 flex items-baseline gap-2"><strong className={`font-display text-[30px] leading-none tracking-[-.05em] ${item.valueTone}`}>{item.value}</strong>{item.unit && <span className="text-[10px] font-semibold text-[#9ca8a2]">{item.unit}</span>}</div><p className="mt-2 text-[10px] leading-4 text-[#6b7c74]">{item.description}</p></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 text-[9px]"><span className="text-[#6b7c74]">{item.footer}</span><Link href={item.href} className="inline-flex shrink-0 items-center gap-1 font-bold text-[#2d6a4f] hover:underline">{item.action}<ArrowRight className="h-3 w-3" /></Link></div></article>; })}</section>

    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Tren dan ranking fill rate"><article className={`${PANEL} min-h-[440px] p-5 sm:p-6 lg:col-span-7`}><ChartHeader title="Demand vs Fulfillment Trend" description="Requested, approved, issued, dan fill rate tujuh hari terakhir." legend={[['#2563eb','Requested'],['#a0c4ff','Approved'],['#2d6a4f','Issued'],['#7c3aed','Fill Rate %']]} /><div className="mt-5 h-[300px]" role="img" aria-label="Mixed area chart demand dan fulfillment"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.trend} margin={{ top:8,right:0,left:-18,bottom:0 }}><CartesianGrid vertical={false} stroke="#e8eeea" /><XAxis dataKey="label" axisLine={{stroke:'#dce4df'}} tickLine={false} tick={{fill:'#6b7c74',fontSize:10}} /><YAxis yAxisId="qty" allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'#6b7c74',fontSize:9}} /><YAxis yAxisId="rate" domain={[0,100]} orientation="right" hide /><Tooltip contentStyle={tooltipStyle} /><Area yAxisId="qty" type="monotone" dataKey="requested" name="Requested" stroke="#2563eb" fill="#dbeafe" fillOpacity={0.55} strokeWidth={2} /><Line yAxisId="qty" type="monotone" dataKey="approved" name="Approved" stroke="#7da9ef" strokeWidth={2} dot={{r:3}} /><Line yAxisId="qty" type="monotone" dataKey="issued" name="Issued" stroke="#2d6a4f" strokeWidth={2.5} dot={{r:3}} /><Line yAxisId="rate" type="monotone" dataKey="fillRate" name="Fill Rate %" stroke="#7c3aed" strokeDasharray="5 4" strokeWidth={2} dot={{r:3}} /></ComposedChart></ResponsiveContainer></div><div className="mt-3 flex flex-col justify-between gap-2 border-t border-[#edf1ee] pt-4 text-[10px] sm:flex-row"><span className="text-[#6b7c74]">Approved: {formatNumber(data.metrics.approvedUnits)} unit</span><strong className={data.metrics.overallFillRate >= data.target ? 'text-[#2d6a4f]' : 'text-[#dc2626]'}>{data.metrics.overallFillRate >= data.target ? 'Target service level tercapai' : `Gap ke target: ${(data.target-data.metrics.overallFillRate).toFixed(1)} poin`}</strong></div></article>
      <article className={`${PANEL} min-h-[440px] p-5 sm:p-6 lg:col-span-5`}><ChartHeader title="Fill Rate per Unit Pemohon" description="Ranking service level berdasarkan unit rumah sakit." /><div className="mt-5 h-[290px]" role="img" aria-label="Horizontal bar chart fill rate per unit"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.unitRanking} layout="vertical" margin={{top:0,right:14,left:8,bottom:0}}><CartesianGrid horizontal={false} stroke="#e8eeea" /><XAxis type="number" domain={[0,100]} tickFormatter={(value) => `${value}%`} axisLine={{stroke:'#dce4df'}} tickLine={false} tick={{fill:'#6b7c74',fontSize:9}} /><YAxis type="category" dataKey="unitName" width={108} axisLine={false} tickLine={false} tick={{fill:'#1b2a24',fontSize:9,fontWeight:600}} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${safeNumber(value).toFixed(1)}%`]} /><Bar dataKey="fillRate" name="Fill Rate" fill="#2d6a4f" radius={[0,6,6,0]} barSize={16} /></BarChart></ResponsiveContainer></div><div className="mt-3 space-y-2 border-t border-[#edf1ee] pt-4">{data.unitRanking.slice(0,4).map((item) => <div key={item.unitId} className="flex items-center gap-2 text-[9px]"><span className="min-w-0 flex-1 truncate font-semibold">{item.unitName}</span><span className="text-[#6b7c74]">Gap {formatNumber(item.gap)}</span><strong className={item.fillRate>=data.target?'text-[#2d6a4f]':'text-[#b86b00]'}>{item.fillRate.toFixed(1)}%</strong></div>)}</div></article>
    </section>

    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Kategori dan critical fulfillment gaps"><article className={`${PANEL} min-h-[430px] p-5 sm:p-6 lg:col-span-7`}><ChartHeader title="Fill Rate per Kategori Produk KFA" description="Perbandingan quantity requested dan issued per kategori." legend={[['#2563eb','Requested'],['#2d6a4f','Issued']]} /><div className="mt-5 h-[300px]" role="img" aria-label="Grouped bar chart fill rate per kategori"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.categoryPerformance} margin={{top:8,right:4,left:-18,bottom:18}}><CartesianGrid vertical={false} stroke="#e8eeea" /><XAxis dataKey="category" interval={0} angle={-12} textAnchor="end" height={48} axisLine={{stroke:'#dce4df'}} tickLine={false} tick={{fill:'#6b7c74',fontSize:8}} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill:'#6b7c74',fontSize:9}} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(value)} unit`]} /><Bar dataKey="requested" name="Requested" fill="#7da9ef" radius={[5,5,0,0]} maxBarSize={32} /><Bar dataKey="issued" name="Issued" fill="#2d6a4f" radius={[5,5,0,0]} maxBarSize={32} /></BarChart></ResponsiveContainer></div><div className="mt-2 flex items-center justify-between border-t border-[#edf1ee] pt-4 text-[10px]"><span className="text-[#6b7c74]">Kategori terendah perlu menjadi prioritas replenishment.</span><Link href="/inventory/reorder" className="font-bold text-[#2d6a4f] hover:underline">Buka Reorder</Link></div></article>
      <aside id="critical-fulfillment" className={`${PANEL} flex min-h-[430px] flex-col justify-between p-5 sm:p-6 lg:col-span-5`}><div><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><AlertOctagon className="h-5 w-5 text-red-500" /><h2 className="font-display text-base font-bold">Critical Fulfillment Gaps</h2></span><small className="rounded-full border border-red-200 bg-red-100 px-2 py-1 text-[9px] font-bold text-red-700">{data.criticalGaps.length} Perlu Tindakan</small></div><p className="mt-2 text-xs text-[#6b7c74]">Gap quantity yang memerlukan proses, picking, alokasi, atau reorder.</p><div className="mt-4 space-y-2.5">{data.criticalGaps.length ? data.criticalGaps.map((gap) => { const tone = gap.tone==='danger'?'border-red-200 bg-red-50 text-red-700':gap.tone==='info'?'border-blue-200 bg-blue-50 text-blue-700':gap.tone==='purple'?'border-violet-200 bg-violet-50 text-violet-700':'border-amber-200 bg-amber-50 text-amber-700'; return <div key={gap.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#e5eae7] bg-[#f8faf9] p-3"><span className="min-w-0"><strong className="block truncate text-[11px]">{gap.title}</strong><small className="mt-0.5 block text-[9px] text-[#6b7c74]">{gap.description}</small></span><Link href={gap.href} className={`shrink-0 rounded-lg border px-2.5 py-1 text-[9px] font-bold ${tone}`}>{gap.actionLabel}</Link></div>; }) : <div className="rounded-xl bg-[#f8faf9] p-6 text-center text-xs text-[#2d6a4f]">Tidak ada gap pada filter aktif.</div>}</div></div><div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-4 text-[9px]"><span className="text-[#9ca8a2]">Prioritas berdasarkan urgency, gap, dan stok tersedia</span><Link href="/requisitions" className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline">Semua Requisition <ArrowRight className="h-3 w-3" /></Link></div></aside>
    </section>

    <section id="fill-rate-ledger" className={`${PANEL} space-y-4 p-5 sm:p-6`} aria-label="Detail fill rate requisition"><div className="flex flex-col justify-between gap-4 border-b border-[#e5eae7] pb-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-[#2d6a4f]" /><h2 className="font-display text-base font-bold">Detail Fill Rate Requisition</h2></div><p className="mt-1 text-xs text-[#6b7c74]">Requested, approved, issued, gap, status, dan fill rate per baris produk.</p></div><div className="flex max-w-full gap-1.5 overflow-x-auto pb-1">{([['ALL','Semua'],['COMPLETE','Complete'],['PARTIAL','Partial'],['STOCKOUT','Stockout'],['PENDING','Pending']] as Array<[FillRateStatus,string]>).map(([value,label]) => <button type="button" key={value} onClick={() => setStatus(value)} className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold ${status===value?'border-[#b9d6c3] bg-[#e8f5e9] text-[#2d6a4f]':'border-[#e5eae7] text-[#6b7c74] hover:bg-[#f1f5f3]'}`}>{label} ({value==='ALL'?data.details.length:data.statusCounts[value]})</button>)}</div></div><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-[10px]"><thead><tr className="border-b border-[#e5eae7] text-[9px] font-bold uppercase tracking-wide text-[#9ca8a2]"><th className="px-3 py-3">Nomor Requisition</th><th className="px-3 py-3">Unit Pemohon</th><th className="px-3 py-3 text-center">Prioritas</th><th className="px-3 py-3">Produk &amp; KFA</th><th className="px-3 py-3 text-right">Requested</th><th className="px-3 py-3 text-right">Approved</th><th className="px-3 py-3 text-right">Issued</th><th className="px-3 py-3 text-right">Gap</th><th className="px-3 py-3 text-center">Fill Rate</th><th className="px-3 py-3 text-center">Status</th><th className="px-3 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-[#edf1ee]">{data.details.map((row) => { const statusClass=row.fulfillmentStatus==='COMPLETE'?'bg-[#d8f3dc] text-[#2d6a4f]':row.fulfillmentStatus==='STOCKOUT'?'bg-red-100 text-red-700':row.fulfillmentStatus==='PARTIAL'?'bg-violet-100 text-violet-700':'bg-amber-100 text-amber-700'; return <tr key={row.id} className="hover:bg-[#f8faf9]"><td className="px-3 py-3"><strong className="block">{row.requestNumber}</strong><small className="text-[#9ca8a2]">{new Intl.DateTimeFormat('id-ID',{dateStyle:'medium'}).format(new Date(row.createdAt))}</small></td><td className="px-3 py-3 font-semibold">{row.unitName}</td><td className="px-3 py-3 text-center"><span className={`rounded-md px-2 py-1 text-[9px] font-bold ${row.priority==='URGENT'?'bg-red-100 text-red-700':'bg-[#f1f3f2] text-[#6b7c74]'}`}>{row.priority}</span></td><td className="max-w-56 px-3 py-3"><strong className="block truncate">{row.productName}</strong><small className="text-[#9ca8a2]">KFA: {row.kfaCode} • {row.category}</small></td><td className="px-3 py-3 text-right">{formatNumber(row.requested)}</td><td className="px-3 py-3 text-right">{formatNumber(row.approved)}</td><td className="px-3 py-3 text-right font-bold text-[#2d6a4f]">{formatNumber(row.issued)}</td><td className={`px-3 py-3 text-right font-bold ${row.gap>0?'text-red-600':'text-[#2d6a4f]'}`}>{formatNumber(row.gap)}</td><td className={`px-3 py-3 text-center font-extrabold ${row.fillRate>=data.target?'text-[#2d6a4f]':'text-[#b86b00]'}`}>{row.fillRate.toFixed(1)}%</td><td className="px-3 py-3 text-center"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusClass}`}>{row.fulfillmentStatus}</span></td><td className="px-3 py-3 text-center"><Link href={row.href} className="rounded-lg border border-[#dfe6e2] px-2.5 py-1 font-bold text-[#2d6a4f] hover:bg-[#e8f5e9]">Detail</Link></td></tr>; })}</tbody></table>{data.details.length===0&&<div className="py-10 text-center text-xs text-[#9ca8a2]">Tidak ada requisition yang cocok dengan filter.</div>}</div><div className="border-t border-[#edf1ee] pt-3 text-[10px] text-[#9ca8a2]">Menampilkan {data.details.length} baris pemenuhan pada filter aktif.</div></section>
  </div>;
}

function FilterSelect({ label, icon: Icon, value, onChange, options }: { label:string; icon: typeof Building2; value:string; onChange:(value:string)=>void; options:Array<[string,string]> }) {
  return <label><span className="mb-1 block text-[8px] font-bold uppercase tracking-wide text-[#9ca8a2]">{label}</span><span className="relative flex h-9 items-center gap-1.5 rounded-xl border border-[#e5eae7] bg-[#f3f6f4] pl-2.5 pr-7 text-[9px] font-semibold"><Icon className="h-3 w-3 shrink-0 text-[#6b7c74]" /><select aria-label={label} value={value} onChange={(event)=>onChange(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent outline-none"><>{options.map(([optionValue,optionLabel])=><option key={optionValue} value={optionValue}>{optionLabel}</option>)}</></select><ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-[#9ca8a2]" /></span></label>;
}

function ChartHeader({ title, description, legend=[] }: { title:string; description:string; legend?:Array<[string,string]> }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#2d6a4f]" /><h2 className="font-display text-base font-bold">{title}</h2></div><p className="mt-1 text-xs text-[#6b7c74]">{description}</p></div>{legend.length>0&&<div className="flex flex-wrap gap-1.5">{legend.map(([color,label])=><span key={label} className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2 py-1 text-[8px] font-semibold"><i className="h-2 w-2 rounded-full" style={{backgroundColor:color}} />{label}</span>)}</div>}</div>;
}

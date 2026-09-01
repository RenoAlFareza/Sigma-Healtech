'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';

const PANEL = 'rounded-[20px] border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)]';
const numberFormatter = new Intl.NumberFormat('id-ID');

function formatNumber(value: unknown): string {
  const num = Number(value);
  return Number.isFinite(num) ? numberFormatter.format(num) : '0';
}

// Supplier Palette & Definitions based on Indonesian Hospital Formulary
const SUPPLIER_CONFIG = [
  { key: 'afiFarma', label: 'AFI FARMA', color: '#0d9488' },
  { key: 'tempoScan', label: 'TEMPO SCAN PACIFIC', color: '#0284c7' },
  { key: 'daryaVaria', label: 'DARYA-VARIA LABORATORIA', color: '#2563eb' },
  { key: 'interbat', label: 'INTERBAT', color: '#7c3aed' },
  { key: 'satoria', label: 'SATORIA ANEKA INDUSTRI', color: '#db2777' },
] as const;

const UNIT_DESTINATION_CONFIG = [
  { key: 'igd', label: 'Instalasi Gawat Darurat (IGD)', color: '#0d9488' },
  { key: 'rawatInap', label: 'Instalasi Rawat Inap (IRNA)', color: '#0284c7' },
  { key: 'kamarOperasi', label: 'Kamar Bedah / Operasi (OK)', color: '#1e40af' },
] as const;

// 1. Mock Data for Stock Movements Received by Month (Supplier Breakdown)
const RECEIVED_BY_MONTH_DATA = [
  { month: 'Apr 2026', total: 8, afiFarma: 2, tempoScan: 2, daryaVaria: 2, interbat: 1, satoria: 1 },
  { month: 'Mei 2026', total: 8, afiFarma: 2, tempoScan: 2, daryaVaria: 2, interbat: 1, satoria: 1 },
  { month: 'Jun 2026', total: 8, afiFarma: 2, tempoScan: 2, daryaVaria: 2, interbat: 1, satoria: 1 },
  { month: 'Jul 2026', total: 8, afiFarma: 2, tempoScan: 2, daryaVaria: 2, interbat: 1, satoria: 1 },
  { month: 'Agu 2026', total: 10, afiFarma: 3, tempoScan: 2, daryaVaria: 2, interbat: 2, satoria: 1 },
  { month: 'Sep 2026', total: 0, afiFarma: 0, tempoScan: 0, daryaVaria: 0, interbat: 0, satoria: 0 },
];

// 2. Mock Data for Stock Movements Sent by Month (Ward Unit Breakdown)
const SENT_BY_MONTH_DATA = [
  { month: 'Apr 2026', total: 8, igd: 3, rawatInap: 3, kamarOperasi: 2 },
  { month: 'Mei 2026', total: 9, igd: 4, rawatInap: 3, kamarOperasi: 2 },
  { month: 'Jun 2026', total: 9, igd: 4, rawatInap: 3, kamarOperasi: 2 },
  { month: 'Jul 2026', total: 9, igd: 4, rawatInap: 3, kamarOperasi: 2 },
  { month: 'Agu 2026', total: 10, igd: 4, rawatInap: 4, kamarOperasi: 2 },
  { month: 'Sep 2026', total: 0, igd: 0, rawatInap: 0, kamarOperasi: 0 },
];

// 3. Mock Data for Stock vs Ad-Hoc Requests
const STOCK_VS_ADHOC_DATA = [
  { name: 'ADHOC (Darurat / CITO)', value: 50, color: '#0e7490' },
  { name: 'STOCK (Rutin Terjadwal)', value: 50, color: '#0284c7' },
];

// 4. Mock Data for Fill Rate Last 12 Months
const FILL_RATE_12_MONTHS_DATA = [
  { month: 'Maret 2026', requests: 5120, avgFillRate: 99, targetFillRate: 90, cancelled: 10 },
  { month: 'April 2026', requests: 4890, avgFillRate: 99, targetFillRate: 90, cancelled: 8 },
  { month: 'Mei 2026', requests: 4780, avgFillRate: 99, targetFillRate: 90, cancelled: 12 },
  { month: 'Juni 2026', requests: 5190, avgFillRate: 99, targetFillRate: 90, cancelled: 5 },
  { month: 'Juli 2026', requests: 5180, avgFillRate: 99, targetFillRate: 90, cancelled: 7 },
  { month: 'Agustus 2026', requests: 5080, avgFillRate: 99, targetFillRate: 90, cancelled: 9 },
];

// 5. Mock Data for Stock Out Last Month
const STOCK_OUT_LAST_MONTH_DATA = [
  { name: 'Never', value: 99.25, color: '#65a30d' },
  { name: 'Stocked out < 1 week', value: 0.75, color: '#eab308' },
];

// OpenBoxes-Style Dark Single-Segment Tooltip for Received Bar Chart
interface OpenBoxesReceivedTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
    payload: { month: string; total: number };
  }>;
  label?: string;
  hoveredKey?: string | null;
}

function OpenBoxesReceivedTooltip({ active, payload, label, hoveredKey }: OpenBoxesReceivedTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const month = label ?? payload[0]?.payload?.month ?? '';
  const activeEntry =
    payload.find((entry) => entry.dataKey === hoveredKey && entry.value > 0) ||
    payload.filter((entry) => entry.value > 0).slice(-1)[0];

  if (!activeEntry) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2 text-center text-white shadow-xl">
        <div className="text-xs font-bold text-white">Tidak ada mutasi: 0</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#94a3b8]">{month}</div>
      </div>
    );
  }

  const supplier = SUPPLIER_CONFIG.find((s) => s.key === activeEntry.dataKey);
  const supplierName = supplier?.label ?? activeEntry.name;

  return (
    <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2.5 text-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
      <div className="text-xs font-bold tracking-wide text-white">
        {supplierName}: {activeEntry.value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">
        {month}
      </div>
    </div>
  );
}

// OpenBoxes-Style Dark Single-Segment Tooltip for Sent Bar Chart
interface OpenBoxesSentTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
    payload: { month: string; total: number };
  }>;
  label?: string;
  hoveredKey?: string | null;
}

function OpenBoxesSentTooltip({ active, payload, label, hoveredKey }: OpenBoxesSentTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const month = label ?? payload[0]?.payload?.month ?? '';
  const activeEntry =
    payload.find((entry) => entry.dataKey === hoveredKey && entry.value > 0) ||
    payload.filter((entry) => entry.value > 0).slice(-1)[0];

  if (!activeEntry) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2 text-center text-white shadow-xl">
        <div className="text-xs font-bold text-white">Tidak ada pengeluaran: 0</div>
        <div className="mt-0.5 text-[10px] font-medium text-[#94a3b8]">{month}</div>
      </div>
    );
  }

  const unit = UNIT_DESTINATION_CONFIG.find((u) => u.key === activeEntry.dataKey);
  const unitName = unit?.label ?? activeEntry.name;

  return (
    <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2.5 text-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
      <div className="text-xs font-bold tracking-wide text-white">
        {unitName}: {activeEntry.value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">
        {month}
      </div>
    </div>
  );
}

// OpenBoxes-Style Dark Tooltip for Fill Rate Last 12 Months
interface OpenBoxesFillRateTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
    payload: { month: string; requests: number; avgFillRate: number; targetFillRate: number; cancelled: number };
  }>;
  label?: string;
  hoveredKey?: string | null;
}

function OpenBoxesFillRateTooltip({ active, payload, label, hoveredKey }: OpenBoxesFillRateTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const month = label ?? payload[0]?.payload?.month ?? '';
  const pData = payload[0]?.payload;

  let title = 'Request lines submitted';
  let valStr = `${formatNumber(pData?.requests ?? 0)}`;

  if (hoveredKey === 'avgFillRate') {
    title = 'Average Fill Rate';
    valStr = `${pData?.avgFillRate ?? 99}%`;
  } else if (hoveredKey === 'targetFillRate') {
    title = 'Average of target Fill Rate';
    valStr = `${pData?.targetFillRate ?? 90}%`;
  } else if (hoveredKey === 'cancelled') {
    title = 'Lines cancelled stock out';
    valStr = `${pData?.cancelled ?? 0}`;
  } else if (hoveredKey === 'requests') {
    title = 'Request lines submitted';
    valStr = `${formatNumber(pData?.requests ?? 0)}`;
  } else {
    // If hovering on column, show the primary request lines submitted
    title = 'Request lines submitted';
    valStr = `${formatNumber(pData?.requests ?? 0)}`;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2.5 text-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
      <div className="text-xs font-bold tracking-wide text-white">
        {title}: {valStr}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">
        {month}
      </div>
    </div>
  );
}

// OpenBoxes-Style Dark Tooltip for Donut Charts
function OpenBoxesDonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-white/10 bg-[#181d24] px-4 py-2.5 text-center text-white shadow-[0_10px_25px_rgba(0,0,0,0.45)]">
      <div className="text-xs font-bold tracking-wide text-white">
        {item.name}: {item.value}%
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">
        Bulan Lalu
      </div>
    </div>
  );
}

export function TransactionManagement() {
  const { activeLocationId } = useActiveLocation();
  const [hoveredReceivedKey, setHoveredReceivedKey] = useState<string | null>(null);
  const [hoveredSentKey, setHoveredSentKey] = useState<string | null>(null);
  const [hoveredFillRateKey, setHoveredFillRateKey] = useState<string | null>(null);

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.04em] text-[#1b2a24] sm:text-3xl">
            Transaction Management
          </h1>
          <p className="mt-0.5 text-xs text-[#6b7c74]">
            Analisis arus mutasi barang masuk &amp; keluar, rasio permintaan rutin vs darurat, dan tingkat pemenuhan (Fill Rate)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e5eae7] bg-white px-3.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f5f3]"
          >
            ← Kembali ke Dashboard Utama
          </Link>
          <Link
            href="/inbound"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#b7e4c7] bg-[#eff9f2] px-3.5 text-xs font-bold text-[#2d6a4f] shadow-sm transition hover:bg-[#d8f3dc]"
          >
            Penerimaan Masuk
          </Link>
          <Link
            href="/outbound"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#22543d]"
          >
            Pengeluaran Barang
          </Link>
        </div>
      </div>

      {/* 2. Row 1: Top Metric Card (Fill Rate Last Month) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ringkasan Fill Rate">
        <article className={`${PANEL} p-5`}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7c74]">
              Fill Rate Last Month
            </p>
            <span className="text-[#9ca8a2]" title="Tingkat pemenuhan permintaan obat bulan lalu">
              <Info className="h-4 w-4" />
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-[36px] font-extrabold leading-none tracking-[-0.05em] text-[#2d6a4f] tabular-nums">
              99%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#16a34a]">
              +9 %
            </span>
          </div>

          {/* Thin Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#e5eae7]">
            <div className="h-full rounded-full bg-[#2d6a4f]" style={{ width: '99%' }} />
          </div>
        </article>
      </section>

      {/* 3. Row 2: 3 Columns Grid (Received by Month, Sent by Month, Stock vs Ad-hoc) */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Grafik mutasi dan perbandingan permintaan">
        {/* Chart 1: Stock Movements Received by Month */}
        <div className={`${PANEL} flex min-h-[380px] flex-col justify-between p-6`}>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1b2a24]">
                Stock Movements Received by Month
              </h2>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2 py-0.5 text-[10px] font-semibold text-[#56595d]">
                  Last 6 Months <ChevronDown className="h-3 w-3 text-[#9ca8a2]" />
                </span>
                <span className="text-[#9ca8a2]" title="Jumlah mutasi barang masuk supplier per bulan">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div className="mt-4 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={RECEIVED_BY_MONTH_DATA}
                  margin={{ top: 20, right: 10, left: -25, bottom: 10 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ee" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#6b7c74', fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#9ca8a2', fontSize: 10 }}
                    domain={[0, 12]}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<OpenBoxesReceivedTooltip hoveredKey={hoveredReceivedKey} />}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar
                    dataKey="afiFarma"
                    name="AFI FARMA"
                    stackId="a"
                    fill="#0d9488"
                    onMouseEnter={() => setHoveredReceivedKey('afiFarma')}
                    onMouseLeave={() => setHoveredReceivedKey(null)}
                  />
                  <Bar
                    dataKey="tempoScan"
                    name="TEMPO SCAN PACIFIC"
                    stackId="a"
                    fill="#0284c7"
                    onMouseEnter={() => setHoveredReceivedKey('tempoScan')}
                    onMouseLeave={() => setHoveredReceivedKey(null)}
                  />
                  <Bar
                    dataKey="daryaVaria"
                    name="DARYA-VARIA"
                    stackId="a"
                    fill="#2563eb"
                    onMouseEnter={() => setHoveredReceivedKey('daryaVaria')}
                    onMouseLeave={() => setHoveredReceivedKey(null)}
                  />
                  <Bar
                    dataKey="interbat"
                    name="INTERBAT"
                    stackId="a"
                    fill="#7c3aed"
                    onMouseEnter={() => setHoveredReceivedKey('interbat')}
                    onMouseLeave={() => setHoveredReceivedKey(null)}
                  />
                  <Bar
                    dataKey="satoria"
                    name="SATORIA ANEKA INDUSTRI"
                    stackId="a"
                    fill="#db2777"
                    onMouseEnter={() => setHoveredReceivedKey('satoria')}
                    onMouseLeave={() => setHoveredReceivedKey(null)}
                  >
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fill: '#1b2a24', fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Arahkan kursor ke segmen warna untuk melihat penerimaan per pabrikan / supplier
          </div>
        </div>

        {/* Chart 2: Stock Movements Sent by Month */}
        <div className={`${PANEL} flex min-h-[380px] flex-col justify-between p-6`}>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1b2a24]">
                Stock Movements Sent by Month
              </h2>
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2 py-0.5 text-[10px] font-semibold text-[#56595d]">
                  Last 6 Months <ChevronDown className="h-3 w-3 text-[#9ca8a2]" />
                </span>
                <span className="text-[#9ca8a2]" title="Jumlah mutasi barang keluar ke unit per bulan">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div className="mt-4 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={SENT_BY_MONTH_DATA}
                  margin={{ top: 20, right: 10, left: -25, bottom: 10 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ee" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#6b7c74', fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#9ca8a2', fontSize: 10 }}
                    domain={[0, 12]}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<OpenBoxesSentTooltip hoveredKey={hoveredSentKey} />}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar
                    dataKey="igd"
                    name="Instalasi Gawat Darurat (IGD)"
                    stackId="a"
                    fill="#0d9488"
                    onMouseEnter={() => setHoveredSentKey('igd')}
                    onMouseLeave={() => setHoveredSentKey(null)}
                  />
                  <Bar
                    dataKey="rawatInap"
                    name="Instalasi Rawat Inap (IRNA)"
                    stackId="a"
                    fill="#0284c7"
                    onMouseEnter={() => setHoveredSentKey('rawatInap')}
                    onMouseLeave={() => setHoveredSentKey(null)}
                  />
                  <Bar
                    dataKey="kamarOperasi"
                    name="Kamar Bedah (OK)"
                    stackId="a"
                    fill="#1e40af"
                    onMouseEnter={() => setHoveredSentKey('kamarOperasi')}
                    onMouseLeave={() => setHoveredSentKey(null)}
                  >
                    <LabelList
                      dataKey="total"
                      position="top"
                      style={{ fill: '#1b2a24', fontSize: 11, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Arahkan kursor ke segmen warna untuk melihat pengeluaran per unit depo farmasi
          </div>
        </div>

        {/* Chart 3: Stock vs ad-hoc requests last month */}
        <div className={`${PANEL} flex min-h-[380px] flex-col justify-between p-6`}>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-[#1b2a24]">
                Stock vs ad-hoc requests last month
              </h2>
              <span className="text-[#9ca8a2]" title="Perbandingan permintaan stok rutin terjadwal vs ad-hoc darurat/CITO">
                <Info className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Legend with Hospital Terms */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-[#1b2a24]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0e7490]" /> ADHOC (CITO / Darurat)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0284c7]" /> STOCK (Rutin Terjadwal)
              </span>
            </div>

            {/* Donut Chart */}
            <div className="relative mt-2 h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STOCK_VS_ADHOC_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {STOCK_VS_ADHOC_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<OpenBoxesDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center percentage badge */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-extrabold text-[#1b2a24]">
                <span>50% : 50%</span>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Mengukur rasio perencanaan stok rutin terhadap lonjakan permintaan darurat unit
          </div>
        </div>
      </section>

      {/* 4. Row 3: 2 Columns Grid (Fill Rate Last 12 Months [8 cols] + Stock out last month [4 cols]) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Grafik Fill Rate 12 Bulan dan Stock Out">
        {/* Column 1: Fill Rate Last 12 Months (lg:col-span-8) */}
        <div className={`${PANEL} flex min-h-[420px] flex-col justify-between p-6 lg:col-span-8`}>
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-base font-bold text-[#1b2a24]">
                Fill Rate Last 12 Months
              </h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold text-[#56595d]">
                  All destinations <ChevronDown className="h-3 w-3 text-[#9ca8a2]" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2.5 py-1 text-[10px] font-semibold text-[#56595d]">
                  Last 6 Months <ChevronDown className="h-3 w-3 text-[#9ca8a2]" />
                </span>
              </div>
            </div>

            {/* Legend on Top */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-[#6b7c74]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#008080]" /> Request lines submitted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1d4ed8]" /> Lines cancelled stock out
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" /> Average Fill Rate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#be185d]" /> Average of target Fill Rate
              </span>
            </div>

            {/* Dual Axis Composed Chart */}
            <div className="mt-4 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={FILL_RATE_12_MONTHS_DATA}
                  margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ee" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#6b7c74', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#9ca8a2', fontSize: 10 }}
                    domain={[0, 6000]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={{ stroke: '#e5eae7' }}
                    tick={{ fill: '#9ca8a2', fontSize: 10 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    content={<OpenBoxesFillRateTooltip hoveredKey={hoveredFillRateKey} />}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="requests"
                    name="Request lines submitted"
                    fill="#008080"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                    onMouseEnter={() => setHoveredFillRateKey('requests')}
                    onMouseLeave={() => setHoveredFillRateKey(null)}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgFillRate"
                    name="Average Fill Rate"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    onMouseEnter={() => setHoveredFillRateKey('avgFillRate')}
                    onMouseLeave={() => setHoveredFillRateKey(null)}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="targetFillRate"
                    name="Average of target Fill Rate"
                    stroke="#be185d"
                    strokeWidth={2}
                    dot={{ r: 3.5, fill: '#be185d', stroke: '#fff', strokeWidth: 1.5 }}
                    onMouseEnter={() => setHoveredFillRateKey('targetFillRate')}
                    onMouseLeave={() => setHoveredFillRateKey(null)}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cancelled"
                    name="Lines cancelled stock out"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#1d4ed8' }}
                    onMouseEnter={() => setHoveredFillRateKey('cancelled')}
                    onMouseLeave={() => setHoveredFillRateKey(null)}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            Tingkat pemenuhan rata-rata berada di 99% (melampaui target standar 90%)
          </div>
        </div>

        {/* Column 2: Stock out last month (lg:col-span-4) */}
        <div className={`${PANEL} flex min-h-[420px] flex-col justify-between p-6 lg:col-span-4`}>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#1b2a24]">
                Stock out last month
              </h2>
              <span className="text-[#9ca8a2]" title="Persentase insiden stockout bulan lalu">
                <Info className="h-4 w-4" />
              </span>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-[#1b2a24]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#65a30d]" /> Never
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#eab308]" /> Stocked out &lt; 1 week
              </span>
            </div>

            {/* Donut Chart */}
            <div className="relative mt-4 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STOCK_OUT_LAST_MONTH_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {STOCK_OUT_LAST_MONTH_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<OpenBoxesDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <span className="block text-2xl font-extrabold text-[#1b2a24] tabular-nums">
                    99.25%
                  </span>
                  <span className="block text-[10px] font-bold uppercase text-[#65a30d]">
                    Zero Stockout
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-[#edf1ee] pt-3 text-[11px] text-[#6b7c74]">
            99.25% item obat selalu tersedia sepanjang siklus operasional bulan lalu
          </div>
        </div>
      </section>
    </div>
  );
}

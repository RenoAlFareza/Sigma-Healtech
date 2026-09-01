'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, ChevronRight, Info } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { InventoryStockLevelSummary } from '../api';

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatNumber(value: unknown): string {
  const num = Number(value);
  return Number.isFinite(num) ? numberFormatter.format(num) : '0';
}

interface InventorySummaryProps {
  data?: InventoryStockLevelSummary;
}

interface HorizontalBarItem {
  id: string;
  name: string;
  count: number;
  color: string;
  href: string;
}

const DEFAULT_BAR_DATA: HorizontalBarItem[] = [
  { id: 'in_stock', name: 'In stock', count: 528, color: '#52b788', href: '/inventory?status=ACTIVE' },
  { id: 'above_max', name: 'Above max', count: 261, color: '#f59e0b', href: '/inventory' },
  { id: 'below_reorder', name: 'Below reorder', count: 97, color: '#f97316', href: '/inventory/reorder' },
  { id: 'below_min', name: 'Below min', count: 59, color: '#ea580c', href: '/inventory?status=LOW_STOCK' },
  { id: 'out_of_stock', name: 'Out of stock', count: 5, color: '#dc2626', href: '/inventory?status=STOCKOUT' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: HorizontalBarItem;
  }>;
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#e5eae7] bg-white px-3.5 py-2.5 shadow-[0_10px_25px_rgba(27,42,36,0.12)]">
      <p className="text-xs font-bold text-[#1b2a24]">{item.name}</p>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="text-[#6b7c74]">Jumlah Produk:</span>
        <strong className="font-bold text-[#1b2a24] tabular-nums">
          {formatNumber(item.count)} SKU
        </strong>
      </div>
    </div>
  );
}

export function InventorySummary({ data }: InventorySummaryProps) {
  const barData: HorizontalBarItem[] = React.useMemo(() => {
    if (!data) return DEFAULT_BAR_DATA;

    const healthy = data.healthy ?? 528;
    const overstocked = data.overstocked ?? 261;
    const belowReorder = data.belowReorder ?? 97;
    const belowMin = data.belowMinimum ?? 59;
    const outOfStock = 5;

    return [
      { id: 'in_stock', name: 'In stock', count: healthy, color: '#52b788', href: '/inventory?status=ACTIVE' },
      { id: 'above_max', name: 'Above max', count: overstocked, color: '#f59e0b', href: '/inventory' },
      { id: 'below_reorder', name: 'Below reorder', count: belowReorder, color: '#f97316', href: '/inventory/reorder' },
      { id: 'below_min', name: 'Below min', count: belowMin, color: '#ea580c', href: '/inventory?status=LOW_STOCK' },
      { id: 'out_of_stock', name: 'Out of stock', count: outOfStock, color: '#dc2626', href: '/inventory?status=STOCKOUT' },
    ];
  }, [data]);

  return (
    <div className="flex h-full min-h-[380px] flex-col justify-between rounded-[20px] border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
      {/* Header (Clean, without top subtitle) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#2d6a4f]" />
            <h2 className="font-display text-base font-bold text-[#1b2a24]">Inventory Summary</h2>
          </div>
          <span className="text-[#9ca8a2]" title="Distribusi level stok produk berdasarkan status">
            <Info className="h-4 w-4" />
          </span>
        </div>

        {/* Optimized Horizontal Bar Chart */}
        <div className="mt-4 h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={barData}
              margin={{ top: 8, right: 48, left: 10, bottom: 8 }}
              barSize={28}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#edf1ee" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={{ stroke: '#e5eae7' }}
                tick={{ fill: '#9ca8a2', fontSize: 11 }}
                domain={[0, 'dataMax + 40']}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: '#e5eae7' }}
                tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }}
                width={96}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8faf9' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(val: unknown) => `${formatNumber(val)}`}
                  style={{ fill: '#1b2a24', fontSize: 12, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer (Clean description + action link) */}
      <div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[11px]">
        <span className="text-[#6b7c74]">
          Kategori ketersediaan stok obat &amp; alkes di gudang
        </span>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1 font-semibold text-[#2d6a4f] hover:underline"
        >
          Lihat Persediaan
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

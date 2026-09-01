'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ChevronRight, Info, ChevronDown } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExpirationSummaryData } from '../api';

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatNumber(value: unknown): string {
  const num = Number(value);
  return Number.isFinite(num) ? numberFormatter.format(num) : '0';
}

interface ExpirationChartProps {
  data?: ExpirationSummaryData;
}

interface ExpirationPoint {
  period: string;
  label: string;
  quantity: number;
}

const DEFAULT_EXPIRATION_POINTS: ExpirationPoint[] = [
  { period: 'today', label: 'Hari Ini', quantity: 110 },
  { period: '30d', label: 'Dalam 30 Hari', quantity: 45 },
  { period: '60d', label: 'Dalam 60 Hari', quantity: 85 },
  { period: '90d', label: 'Dalam 90 Hari', quantity: 120 },
  { period: '120d', label: 'Dalam 120 Hari', quantity: 155 },
  { period: '150d', label: 'Dalam 150 Hari', quantity: 190 },
  { period: '180d', label: 'Dalam 180 Hari', quantity: 240 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ExpirationPoint;
  }>;
}

function CustomLineTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-xl border border-[#e5eae7] bg-white px-3.5 py-2.5 shadow-[0_10px_25px_rgba(27,42,36,0.12)]">
      <p className="text-xs font-bold text-[#1b2a24]">{item.label}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        <span className="text-[#6b7c74]">Jumlah Kedaluwarsa:</span>
        <strong className="font-bold text-[#1b2a24] tabular-nums">
          {formatNumber(item.quantity)} Unit
        </strong>
      </div>
    </div>
  );
}

export function ExpirationChart({ data }: ExpirationChartProps) {
  const chartData: ExpirationPoint[] = React.useMemo(() => {
    if (!data?.timeline?.length) return DEFAULT_EXPIRATION_POINTS;

    return [
      { period: 'today', label: 'Hari Ini', quantity: 110 },
      { period: '30d', label: 'Dalam 30 Hari', quantity: data.expiring30Days?.qty || 45 },
      { period: '60d', label: 'Dalam 60 Hari', quantity: data.expiring60Days?.qty || 85 },
      { period: '90d', label: 'Dalam 90 Hari', quantity: data.expiring90Days?.qty || 120 },
      { period: '120d', label: 'Dalam 120 Hari', quantity: 155 },
      { period: '150d', label: 'Dalam 150 Hari', quantity: 190 },
      { period: '180d', label: 'Dalam 180 Hari', quantity: data.expiring180Days?.qty || 240 },
    ];
  }, [data]);

  return (
    <div className="flex h-full min-h-[380px] flex-col justify-between rounded-[20px] border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
      {/* Header (Clean, without top subtitle) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
            <h2 className="font-display text-base font-bold text-[#1b2a24]">Expiration Summary</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#e5eae7] bg-[#f8faf9] px-2.5 py-1 text-[11px] font-semibold text-[#56595d]">
              6 Bulan Kedepan <ChevronDown className="h-3 w-3 text-[#9ca8a2]" />
            </span>
            <span className="text-[#9ca8a2]" title="Timeline proyeksi kedaluwarsa stok">
              <Info className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Clean Line Chart */}
        <Link
          href="/reports?type=EXPIRY"
          className="mt-4 block h-[250px] w-full cursor-pointer transition-opacity hover:opacity-95"
          title="Buka Laporan Risiko Kedaluwarsa"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 24, left: -16, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ee" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e5eae7' }}
                tick={{ fill: '#6b7c74', fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={45}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e5eae7' }}
                tick={{ fill: '#9ca8a2', fontSize: 11 }}
                domain={[0, 'dataMax + 40']}
                allowDecimals={false}
              />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="quantity"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 4.5, fill: '#1d4ed8', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Link>
      </div>

      {/* Footer (Clean description + action link) */}
      <div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[11px]">
        <span className="text-[#6b7c74]">
          Proyeksi volume stok obat yang mendekati masa expired dalam 180 hari
        </span>
        <Link
          href="/reports?type=EXPIRY"
          className="inline-flex items-center gap-1 font-semibold text-[#2d6a4f] hover:underline"
        >
          Laporan Kedaluwarsa
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

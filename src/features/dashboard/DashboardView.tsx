"use client";

import React, { useEffect, useState } from 'react';
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
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card, Skeleton, ErrorState } from '@/shared/ui';
import { getDashboardSummary, getDashboardTrend } from './api';
import type { DashboardSummary, DashboardTrendData } from './api';

// Chart Colors using Atria Banner Health Design System Tokens
const BRAND_COLORS = {
  brand: '#00205B',
  accent: '#007EB4',
  success: '#008522',
  warning: '#BF8900',
  error: '#DA291C',
  alert: '#0077C8',
  neutral: '#7B7F84',
};

const PIE_COLORS = [BRAND_COLORS.success, BRAND_COLORS.warning, BRAND_COLORS.error, BRAND_COLORS.alert];

function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'alert';
  icon?: React.ReactNode;
}) {
  const variantStyles = {
    default: 'border-[var(--color-neutral-200)] text-[var(--color-text-main)]',
    success: 'border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]',
    warning: 'border-[var(--color-warning)] bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    error: 'border-[var(--color-error)] bg-[var(--color-error-light)] text-[var(--color-error)]',
    alert: 'border-[var(--color-alert)] bg-[var(--color-alert-light)] text-[var(--color-alert)]',
  };

  return (
    <Card className={`p-4 border-l-4 ${variantStyles[variant]} shadow-xs bg-white`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </span>
        {icon && <div className="text-[var(--color-text-muted)]">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs font-medium text-[var(--color-text-muted)]">{subtitle}</span>
        )}
      </div>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 bg-white border border-[var(--color-neutral-200)] shadow-xs flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-main)] tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="w-full flex-1 min-h-[260px]">{children}</div>
    </Card>
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
      const [sumRes, trendRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardTrend(),
      ]);
      setSummary(sumRes);
      setTrend(trendRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-skeleton">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-md)]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-[var(--radius-md)]" />
          <Skeleton className="h-80 w-full rounded-[var(--radius-md)]" />
        </div>
      </div>
    );
  }

  if (error || !summary || !trend) {
    return (
      <ErrorState
        title="Gagal Memuat Dashboard"
        message={error || 'Terjadi kesalahan sistem saat mengambil data rantai pasok.'}
        onRetry={fetchData}
      />
    );
  }

  // Stock status doughnut data preparation
  const stockStatusData = [
    { name: 'Stok Aman', value: summary.totalProducts - (summary.lowStockCount + summary.stockoutCount + summary.expiring30DaysCount) },
    { name: 'Stok Menipis', value: summary.lowStockCount },
    { name: 'Stok Habis', value: summary.stockoutCount },
    { name: 'Kadaluarsa <=30hr', value: summary.expiring30DaysCount },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-neutral-200)] pb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-brand)]">
            Dashboard Pemantauan Logistik
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Ringkasan status persediaan, pergerakan barang, dan performa pemenihan (Fill Rate)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-success-light)] text-[var(--color-success)] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
            Sistem Aktif Real-Time
          </span>
        </div>
      </div>

      {/* KPI StatCards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Produk" value={summary.totalProducts} subtitle="SKU Terdaftar" />
        <StatCard title="Stok Menipis" value={summary.lowStockCount} variant="warning" subtitle="≤ Minimum" />
        <StatCard title="Stok Habis" value={summary.stockoutCount} variant="error" subtitle="Stockout" />
        <StatCard title="Kadaluarsa ≤30 Hari" value={summary.expiring30DaysCount} variant="warning" subtitle="Batch Expiring" />
        <StatCard title="Pending Req" value={summary.pendingRequisitionsCount} variant="alert" subtitle="Menunggu Approval" />
        <StatCard title="Fill Rate" value={`${summary.fillRatePercentage}%`} variant="success" subtitle="Target ≥ 95%" />
      </div>

      {/* Main Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FillRateChart */}
        <ChartCard 
          title="Tren Pemenuhan Permintaan (Fill Rate)" 
          subtitle="Persentase keberhasilan pemenuhan permintaan obat per bulan"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend.monthlyFillRate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEDEE" />
              <XAxis dataKey="month" stroke="#7B7F84" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#007EB4" fontSize={11} unit="%" />
              <YAxis yAxisId="left" stroke="#00205B" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', borderColor: '#CFD1D3', fontSize: '12px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="qtyLeft" name="Volume Pasok" stroke={BRAND_COLORS.brand} strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="fillRatePercent" name="Fill Rate %" stroke={BRAND_COLORS.accent} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* StockoutTrendChart */}
        <ChartCard 
          title="Tren Kejadian Stok Habis (Stockout)" 
          subtitle="Jumlah insiden stockout mingguan/bulanan di seluruh depo"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend.monthlyStockout} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEDEE" />
              <XAxis dataKey="month" stroke="#7B7F84" fontSize={11} />
              <YAxis stroke="#DA291C" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', borderColor: '#CFD1D3', fontSize: '12px' }} 
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="stockoutCount" name="Jumlah Kejadian Stockout" stroke={BRAND_COLORS.error} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Main Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CategoryBarChart */}
        <ChartCard 
          title="Pengeluaran per Kelas Terapi" 
          subtitle="Volume pasok barang berdasarkan kategori farmasi"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trend.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEDEE" />
              <XAxis dataKey="category" stroke="#7B7F84" fontSize={10} tickFormatter={(val) => val.split(' ')[0]} />
              <YAxis stroke="#7B7F84" fontSize={11} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="quantity" name="Jumlah Unit" fill={BRAND_COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* StockStatusDoughnut */}
        <ChartCard 
          title="Distribusi Status Stok" 
          subtitle="Proporsi kesehatan stok secara keseluruhan"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stockStatusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {stockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* FastMoversBarChart */}
        <ChartCard 
          title="Top 5 Produk Fast-Moving" 
          subtitle="Obat dengan perputaran paling cepat bulan ini"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart 
              data={trend.fastMovers} 
              layout="vertical" 
              margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEDEE" />
              <XAxis type="number" stroke="#7B7F84" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#7B7F84" fontSize={10} width={90} tickFormatter={(val) => val.slice(0, 12) + '...'} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Bar dataKey="totalQty" name="Total Pengeluaran" fill={BRAND_COLORS.brand} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { Card, DataTable, Tabs, Button, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn, TabItem } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getReport } from './api';
import type { ReportData, ReportType } from './api';

export function ReportsHub({ initialType = 'summary' }: { initialType?: ReportType }) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeLocationId } = useActiveLocation();
  const [type, setType] = useState<ReportType>(initialType);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (reportType: ReportType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReport(reportType, { locationId: activeLocationId ?? undefined });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchData(type);
  }, [type, fetchData]);

  const handleTabChange = (tabId: string) => {
    const nextType = tabId as ReportType;
    setType(nextType);
    router.replace(`${pathname}?type=${nextType}`, { scroll: false });
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = data.type === 'transactions'
      ? data.rows.map((r) => ({ date: formatDate(r.date), type: r.type, qtyIn: r.qtyIn ?? '', qtyOut: r.qtyOut ?? '', balance: r.balance, user: r.user, ref: r.reference ?? '' }))
      : renderGenericRows(data);
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-report-${data.type}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTabContent = () => {
    if (!data) return null;
    switch (data.type) {
      case 'expiry':
        return renderExpiry(data.rows);
      case 'stockout':
        return renderStockout(data.rows);
      case 'summary':
        return renderSummary(data.rows);
      case 'transactions':
        return renderTransactions(data.rows);
    }
  };

  const tabs: TabItem[] = [
    { id: 'expiry', label: 'Kedaluwarsa', content: renderTabContent() },
    { id: 'stockout', label: 'Stockout', content: renderTabContent() },
    { id: 'summary', label: 'Ringkasan Inventori', content: renderTabContent() },
    { id: 'transactions', label: 'Transaksi', content: renderTabContent() },
  ];

  if (loading) {
    return (
      <Card title="Laporan" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => fetchData(type)} title="Gagal Memuat Laporan" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Laporan & Analitik"
        subtitle="Expiry, stockout, ringkasan inventori, dan jejak transaksi"
        headerAction={
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        }
        padding="md"
      >
        <Tabs items={tabs} activeTabId={type} onTabChange={handleTabChange} />
      </Card>
    </div>
  );
}

function renderExpiry(rows: any[]) {
  const columns: DataTableColumn<any>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
    { id: 'name', header: 'Produk', accessorKey: 'name' },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'expiry', header: 'Kedaluwarsa', accessorKey: 'expiry', isMono: true },
    { id: 'qtyOnHand', header: 'Qty', align: 'right', accessorKey: 'qtyOnHand' },
    { id: 'daysRemaining', header: 'Hari', align: 'right', accessorKey: 'daysRemaining' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
  ];
  return <DataTable data={rows} columns={columns} keyExtractor={(r: any) => `${r.productId}:${r.lot}`} emptyText="Tidak ada data kedaluwarsa" />;
}

function renderStockout(rows: any[]) {
  const columns: DataTableColumn<any>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
    { id: 'name', header: 'Produk', accessorKey: 'name' },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
    { id: 'qtyOnHand', header: 'Qty', align: 'right', accessorKey: 'qtyOnHand' },
    { id: 'status', header: 'Status', accessorKey: 'status' },
  ];
  return <DataTable data={rows} columns={columns} keyExtractor={(r: any) => `${r.productId}:${r.lot}`} emptyText="Tidak ada data stockout" />;
}

function renderSummary(rows: any[]) {
  const columns: DataTableColumn<any>[] = [
    { id: 'category', header: 'Kategori', accessorKey: 'category' },
    { id: 'productCount', header: 'SKU', align: 'right', accessorKey: 'productCount' },
    { id: 'qty', header: 'Qty', align: 'right', accessorKey: 'qty' },
    { id: 'value', header: 'Nilai', align: 'right', cell: (r: any) => formatCurrency(r.value) },
  ];
  return <DataTable data={rows} columns={columns} keyExtractor={(r: any) => r.category} emptyText="Tidak ada data ringkasan" />;
}

function renderTransactions(rows: any[]) {
  const columns: DataTableColumn<any>[] = [
    { id: 'date', header: 'Tanggal', accessorKey: 'date', isMono: true },
    { id: 'type', header: 'Tipe', accessorKey: 'type' },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'qtyIn', header: 'Masuk', align: 'right', accessorKey: 'qtyIn' },
    { id: 'qtyOut', header: 'Keluar', align: 'right', accessorKey: 'qtyOut' },
    { id: 'balance', header: 'Saldo', align: 'right', accessorKey: 'balance' },
    { id: 'user', header: 'User', accessorKey: 'user' },
  ];
  return <DataTable data={rows} columns={columns} keyExtractor={(r: any) => r.reference ?? `${r.date}-${r.type}-${Math.random()}`} emptyText="Belum ada transaksi" />;
}

function renderGenericRows(data: ReportData): Record<string, string | number>[] {
  if (data.type === 'expiry') return data.rows.map((r) => ({ ...r, expiry: formatDate(r.expiry) }));
  if (data.type === 'stockout') return data.rows.map((r) => ({ ...r }));
  if (data.type === 'summary') return data.rows.map((r) => ({ ...r }));
  return data.rows.map((r) => ({ date: formatDate(r.date), type: r.type, qtyIn: r.qtyIn ?? '', qtyOut: r.qtyOut ?? '', balance: r.balance, user: r.user, ref: r.reference ?? '' }));
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '')}"`).join(','));
  }
  return lines.join('\n');
}

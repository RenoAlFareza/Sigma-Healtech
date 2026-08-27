'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShoppingCart } from 'lucide-react';
import { Card, DataTable, StatusBadge, Button, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency, formatDate, formatNumber } from '@/shared/lib/format';
import { listPOs } from './api';
import type { PurchaseOrder } from '@/shared/types/domain';

export function ProcurementList() {
  const router = useRouter();
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listPOs({});
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat PO');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: DataTableColumn<PurchaseOrder>[] = useMemo(
    () => [
      { id: 'poNumber', header: 'No. PO', accessorKey: 'poNumber', isMono: true, width: '150px' },
      { id: 'supplierName', header: 'Supplier', accessorKey: 'supplierName' },
      { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} size="sm" /> },
      { id: 'total', header: 'Total', align: 'right', cell: (p) => formatCurrency(p.total) },
      {
        id: 'progress',
        header: 'Progress',
        align: 'right',
        cell: (p) => {
          const received = p.items.reduce((s, it) => s + it.qtyReceived, 0);
          const total = p.items.reduce((s, it) => s + it.qty, 0);
          return formatNumber(Math.round((received / (total || 1)) * 100)) + '%';
        },
      },
      { id: 'createdAt', header: 'Tanggal', cell: (p) => formatDate(p.createdAt, 'short') },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Purchase Order" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat PO" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Purchase Order"
        subtitle="Pesanan pembelian ke supplier"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push('/procurement/new')}>
            Buat PO
          </Button>
        }
        padding="md"
      >
        <DataTable data={data} columns={columns} keyExtractor={(p) => p.id} loading={false} emptyText="Belum ada PO" emptyIcon={<ShoppingCart className="w-6 h-6" />} onRowClick={(p) => router.push(`/procurement/${p.id}`)} />
      </Card>
    </div>
  );
}
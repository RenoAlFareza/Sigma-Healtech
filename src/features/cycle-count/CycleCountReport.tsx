'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, DataTable, Skeleton, ErrorState, StatusBadge } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { getCycleCount } from './api';
import type { CycleCountItem } from '@/shared/types/domain';

export function CycleCountReport({ id }: { id: string }) {
  const [items, setItems] = useState<CycleCountItem[]>([]);
  const [countNumber, setCountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getCycleCount(id);
      setCountNumber(c.countNumber);
      setItems(c.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const matched = items.filter((it) => (it.variance ?? 0) === 0).length;
  const accuracy = items.length > 0 ? Math.round((matched / items.length) * 100) : 0;

  const columns: DataTableColumn<CycleCountItem>[] = [
    { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
    { id: 'systemQty', header: 'System', align: 'right', cell: (it) => String(it.systemQty) },
    { id: 'countedQty', header: 'Counted', align: 'right', cell: (it) => String(it.countedQty ?? it.systemQty) },
    { id: 'variance', header: 'Variance', align: 'right', cell: (it) => String(it.variance ?? 0) },
    { id: 'reason', header: 'Alasan', accessorKey: 'reasonCode' },
    { id: 'status', header: 'Status', cell: (it) => <StatusBadge status={(it.variance ?? 0) === 0 ? 'IN_STOCK' : 'PARTIAL'} size="sm" /> },
  ];

  if (loading) {
    return (
      <Card title="Laporan Cycle Count" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Laporan" />;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Laporan Cycle Count" subtitle={`No. ${countNumber}`} padding="md">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="rounded-md border border-border-main p-4">
            <div className="text-muted uppercase tracking-wider text-xs font-semibold">Akurasi</div>
            <div className="text-2xl font-bold text-brand mt-1">{accuracy}%</div>
          </div>
          <div className="rounded-md border border-border-main p-4">
            <div className="text-muted uppercase tracking-wider text-xs font-semibold">Item Cocok</div>
            <div className="text-2xl font-bold text-brand mt-1">{matched} / {items.length}</div>
          </div>
        </div>
        <DataTable data={items} columns={columns} keyExtractor={(it) => `${it.productId}:${it.lot}`} emptyText="Tidak ada item" />
      </Card>
    </div>
  );
}
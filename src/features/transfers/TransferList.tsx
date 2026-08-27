'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';
import { Card, DataTable, StatusBadge, Button, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { listTransfers } from './api';
import type { StockTransfer } from '@/shared/types/domain';

export function TransferList() {
  const router = useRouter();
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTransfers({ originId: activeLocationId ?? undefined });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transfer');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: DataTableColumn<StockTransfer>[] = useMemo(
    () => [
      { id: 'transferNumber', header: 'No. Transfer', accessorKey: 'transferNumber', isMono: true, width: '160px' },
      { id: 'originId', header: 'Asal', accessorKey: 'originId', isMono: true },
      { id: 'destinationId', header: 'Tujuan', accessorKey: 'destinationId', isMono: true },
      { id: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} size="sm" /> },
      { id: 'items', header: 'Jumlah Item', align: 'right', cell: (t) => formatQuantity(t.items?.length ?? 0) },
      { id: 'createdAt', header: 'Tanggal', cell: (t) => formatDate(t.createdAt, 'short') },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Transfer Stok" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Transfer" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Transfer Stok"
        subtitle="Perpindahan stok antar unit"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<ArrowRightLeft className="w-4 h-4" />} onClick={() => router.push('/transfers/new')}>
            Buat Transfer
          </Button>
        }
        padding="md"
      >
        <DataTable data={data} columns={columns} keyExtractor={(t) => t.id} loading={false} emptyText="Tidak ada transfer" onRowClick={(t) => router.push(`/transfers/${t.id}`)} />
      </Card>
    </div>
  );
}
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Truck } from 'lucide-react';
import { Card, DataTable, StatusBadge, Select, Button, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { listOutbound } from './api';
import type { StockMovement } from '@/shared/types/domain';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'DRAFT', label: 'DRAFT' },
  { value: 'ITEMS', label: 'ITEMS' },
  { value: 'PICKING', label: 'PICKING' },
  { value: 'PACKED', label: 'PACKED' },
  { value: 'DISPATCHED', label: 'DISPATCHED' },
  { value: 'RECEIVED', label: 'RECEIVED' },
];

export function OutboundList() {
  const router = useRouter();
  const { activeLocationId } = useActiveLocation();
  const [status, setStatus] = useState('ALL');
  const [data, setData] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listOutbound({
        status: status === 'ALL' ? undefined : (status as never),
        originId: activeLocationId ?? undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat outbound');
    } finally {
      setLoading(false);
    }
  }, [status, activeLocationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: DataTableColumn<StockMovement>[] = useMemo(
    () => [
      { id: 'movementNumber', header: 'No. Outbound', accessorKey: 'movementNumber', isMono: true, width: '160px' },
      { id: 'type', header: 'Tipe', accessorKey: 'type' },
      { id: 'originId', header: 'Asal', accessorKey: 'originId', isMono: true },
      { id: 'destinationId', header: 'Tujuan', accessorKey: 'destinationId', isMono: true },
      { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} size="sm" /> },
      { id: 'items', header: 'Jumlah Item', align: 'right', cell: (r) => formatQuantity(r.items?.length ?? 0) },
      { id: 'createdAt', header: 'Tanggal', cell: (r) => formatDate(r.createdAt, 'short') },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Outbound" padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Outbound" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Outbound"
        subtitle="Pengiriman barang keluar gudang"
        headerAction={
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => router.push('/outbound/new')}>
            Buat Outbound
          </Button>
        }
        padding="md"
      >
        <div className="flex flex-col md:flex-row gap-3 mb-2">
          <div className="w-full md:w-52">
            <Select
              id="ob-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(r) => r.id}
          loading={false}
          emptyText="Tidak ada outbound"
          emptyIcon={<Truck className="w-6 h-6" />}
          onRowClick={(r) => router.push(`/outbound/${r.id}`)}
        />
      </Card>
    </div>
  );
}
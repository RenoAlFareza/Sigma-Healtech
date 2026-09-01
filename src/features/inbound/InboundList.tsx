'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, Boxes, ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Card, DataTable, ErrorState, Select, Skeleton, StatusBadge } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatQuantity } from '@/shared/lib/format';
import type { InboundReceipt, InboundStatus } from '@/shared/types/domain';
import { listInbound } from './api';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'CREATED', label: 'Menunggu Penerimaan' },
  { value: 'RECEIVING', label: 'Sedang Diterima' },
  { value: 'COMPLETED', label: 'Selesai' },
];

export function InboundList({ mode = 'receiving' }: { mode?: 'receiving' | 'putaway' }) {
  const router = useRouter();
  const { role } = useAuth();
  const canProcess = role !== null && ['ASSISTANT', 'MANAGER', 'ADMIN'].includes(role);
  const [status, setStatus] = useState(mode === 'putaway' ? 'COMPLETED' : 'ALL');
  const [data, setData] = useState<InboundReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listInbound({
        status: status === 'ALL' ? undefined : status as InboundStatus,
      });
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat penerimaan');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const columns = useMemo<DataTableColumn<InboundReceipt>[]>(() => [
    { id: 'receiptNumber', header: 'No. Penerimaan', accessorKey: 'receiptNumber', isMono: true, width: '170px' },
    { id: 'sourceType', header: 'Sumber', accessorKey: 'sourceType' },
    { id: 'referenceId', header: 'Referensi', cell: (receipt) => receipt.referenceId || '—' },
    { id: 'status', header: 'Status', cell: (receipt) => <StatusBadge status={receipt.status} size="sm" /> },
    { id: 'items', header: 'SKU', align: 'right', cell: (receipt) => formatQuantity(receipt.items.length) },
    {
      id: 'expected',
      header: 'Qty Diharapkan',
      align: 'right',
      cell: (receipt) => formatQuantity(receipt.items.reduce((total, item) => total + item.qtyExpected, 0)),
    },
  ], []);

  if (loading) {
    return (
      <Card title={mode === 'putaway' ? 'Antrean Putaway' : 'Penerimaan Barang'} padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={5} />
        </div>
      </Card>
    );
  }

  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Penerimaan" />;

  return (
    <Card
      title={mode === 'putaway' ? 'Antrean Putaway' : 'Penerimaan Barang'}
      subtitle={mode === 'putaway'
        ? 'Pilih penerimaan selesai untuk menempatkan barang ke bin penyimpanan.'
        : 'Pantau receipt supplier, lot, expiry, dan discrepancy penerimaan.'}
      padding="md"
    >
      {mode === 'receiving' && (
        <div className="mb-4 w-full sm:w-60">
          <Select
            id="inbound-status"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(receipt) => receipt.id}
        emptyText={mode === 'putaway' ? 'Belum ada receipt siap putaway' : 'Belum ada penerimaan'}
        emptyIcon={mode === 'putaway' ? <Boxes className="h-6 w-6" /> : <ArrowDownToLine className="h-6 w-6" />}
        rowActions={canProcess ? (receipt) => {
          const href = mode === 'putaway'
            ? `/inbound/putaway?id=${receipt.id}`
            : receipt.status === 'COMPLETED'
              ? `/inbound/putaway?id=${receipt.id}`
              : `/inbound?id=${receipt.id}`;
          return (
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              onClick={() => router.push(href)}
            >
              {mode === 'putaway' || receipt.status === 'COMPLETED' ? 'Atur Bin' : 'Proses'}
            </Button>
          );
        } : undefined}
      />
    </Card>
  );
}

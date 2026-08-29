'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList } from 'lucide-react';
import { Card, DataTable, StatusBadge, Select, Button, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { listRequisitions } from './api';
import type { ListRequisitionsParams } from './api';
import type { Requisition } from '@/shared/types/domain';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'CREATED', label: 'CREATED' },
  { value: 'SUBMITTED', label: 'SUBMITTED' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'PICKING', label: 'PICKING' },
  { value: 'ISSUED', label: 'ISSUED' },
  { value: 'RECEIVED', label: 'RECEIVED' },
];

export function RequisitionList({ initialStatus = 'ALL' }: { initialStatus?: string }) {
  const router = useRouter();
  const { user, role } = useAuth();

  const [status, setStatus] = useState(initialStatus);
  const [origin, setOrigin] = useState('ALL');
  const [data, setData] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REQUESTOR/VIEWER see only the requisitions they requested.
  const requesterOnly = role === 'REQUESTOR' || role === 'VIEWER';
  const effectiveOrigin = requesterOnly ? undefined : origin;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListRequisitionsParams = {
      status: status === 'ALL' ? undefined : (status as never),
      originId: effectiveOrigin,
      requestedBy: requesterOnly ? user?.id : undefined,
    };
    try {
      const res = await listRequisitions(params);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat permintaan');
    } finally {
      setLoading(false);
    }
  }, [status, effectiveOrigin, requesterOnly, user?.id]);

  useEffect(() => {
    const requestId = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(requestId);
  }, [fetchData]);

  const columns: DataTableColumn<Requisition>[] = useMemo(
    () => [
      { id: 'requestNumber', header: 'No. Req', accessorKey: 'requestNumber', isMono: true, width: '160px' },
      { id: 'originId', header: 'Unit Asal', accessorKey: 'originId', isMono: true },
      { id: 'requestedBy', header: 'Pemohon', accessorKey: 'requestedBy' },
      {
        id: 'priority',
        header: 'Prioritas',
        cell: (r) => <StatusBadge status={r.priority === 'URGENT' ? 'CRITICAL' : 'INFO'} label={r.priority} size="sm" />,
      },
      {
        id: 'status',
        header: 'Status',
        cell: (r) => <StatusBadge status={r.status} size="sm" />,
      },
      { id: 'createdAt', header: 'Tanggal', cell: (r) => formatDate(r.createdAt, 'short') },
      {
        id: 'items',
        header: 'Jumlah Item',
        align: 'right',
        cell: (r) => String(r.items?.length ?? 0),
      },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Permintaan Stok" padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Permintaan" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Permintaan Stok"
        subtitle="Pantau status permintaan stok"
        headerAction={
          !requesterOnly ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/requisitions/create')}
            >
              Buat Permintaan
            </Button>
          ) : undefined
        }
        padding="md"
      >
        <div className="flex flex-col md:flex-row gap-3 mb-2">
          <div className="w-full md:w-52">
            <Select
              id="req-status"
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
          {!requesterOnly && (
            <div className="w-full md:w-56">
              <Select
                id="req-origin"
                label="Unit Asal"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Semua Unit' },
                  { value: 'wh-pusat', label: 'Gudang Farmasi Pusat' },
                  { value: 'depo-rawat-inap', label: 'Depo Rawat Inap' },
                  { value: 'depo-igd', label: 'Depo IGD' },
                  { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan' },
                ]}
              />
            </div>
          )}
        </div>

        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(r) => r.id}
          loading={false}
          emptyText="Tidak ada permintaan"
          emptyIcon={<ClipboardList className="w-6 h-6" />}
          onRowClick={(r) => router.push(`/requisitions/${r.id}`)}
        />
      </Card>
    </div>
  );
}

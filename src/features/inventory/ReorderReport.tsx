'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ClipboardList } from 'lucide-react';
import { Card, DataTable, Button, Select, Skeleton, ErrorState, EmptyState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getReorderReport } from './api';
import type { ReorderReportItem } from './api';
import { useAuth } from '@/features/auth/AuthProvider';

export function ReorderReport() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateRequisition = role !== null && ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST'].includes(role);
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<ReorderReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!activeLocationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReorderReport({ locationId: activeLocationId });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat laporan reorder');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: DataTableColumn<ReorderReportItem>[] = [
    { id: 'kfaCode', header: 'SKU', cell: (it) => it.product.kfaCode, isMono: true, width: '110px' },
    { id: 'name', header: 'Nama Produk', cell: (it) => it.product.name },
    {
      id: 'qtyOnHand',
      header: 'QoH',
      align: 'right',
      cell: (it) => formatQuantity(it.qtyOnHand),
    },
    {
      id: 'reorderPoint',
      header: 'Reorder Point',
      align: 'right',
      cell: (it) => formatQuantity(it.reorderPoint),
    },
    {
      id: 'suggestedQty',
      header: 'Qty Disarankan',
      align: 'right',
      cell: (it) => formatQuantity(it.suggestedQty),
    },
  ];

  if (loading) {
    return (
      <Card title="Laporan Reorder" padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Laporan" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Laporan Reorder"
        subtitle="Item yang perlu di-reorder (di bawah reorder point)"
        headerAction={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Lokasi: {activeLocationId}</span>
          </div>
        }
        padding="md"
      >
        <DataTable
          data={data}
          columns={columns}
          keyExtractor={(it) => it.product.id}
          loading={false}
          emptyText="Tidak ada item yang perlu di-reorder"
          rowActions={canCreateRequisition ? (it) => (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
              onClick={() => router.push(`/requisitions?prefill=${it.product.id}`)}
            >
              Buat Requisition
            </Button>
          ) : undefined}
        />
      </Card>
    </div>
  );
}

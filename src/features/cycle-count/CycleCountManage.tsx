'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ClipboardList } from 'lucide-react';
import { Card, DataTable, StatusBadge, Button, Select, Input, Skeleton, ErrorState } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatDate } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { createCycleCount, listCycleCounts } from './api';
import type { CycleCount } from '@/shared/types/domain';
import { useAuth } from '@/features/auth/AuthProvider';

export function CycleCountManage() {
  const router = useRouter();
  const { role } = useAuth();
  const canCreateCount = role !== null && ['MANAGER', 'ADMIN'].includes(role);
  const { activeLocationId } = useActiveLocation();
  const [data, setData] = useState<CycleCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('ALL');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCycleCounts({ locationId: activeLocationId ?? undefined });
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat cycle count');
    } finally {
      setLoading(false);
    }
  }, [activeLocationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!activeLocationId) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createCycleCount({ locationId: activeLocationId, category });
      router.push(`/cycle-count/count?id=${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat cycle count');
    } finally {
      setCreating(false);
    }
  };

  const columns: DataTableColumn<CycleCount>[] = [
    { id: 'countNumber', header: 'No. Count', accessorKey: 'countNumber', isMono: true, width: '140px' },
    { id: 'locationId', header: 'Lokasi', accessorKey: 'locationId', isMono: true },
    { id: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} size="sm" /> },
    { id: 'items', header: 'Jumlah Item', align: 'right', cell: (c) => String(c.items?.length ?? 0) },
    { id: 'createdAt', header: 'Tanggal', cell: (c) => formatDate(c.createdAt, 'short') },
  ];

  if (loading) {
    return (
      <Card title="Cycle Count" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Cycle Count" />;

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Cycle Count"
        subtitle="Opname stok per lokasi"
        headerAction={canCreateCount ? (
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} isLoading={creating} onClick={handleCreate}>
            Mulai Count Baru
          </Button>
        ) : undefined}
        padding="md"
      >
        <div className="flex flex-col md:flex-row gap-3 mb-2">
          <div className="w-full md:w-56">
            <Select id="cc-category" label="Kategori (opsional)" value={category} onChange={(e) => setCategory(e.target.value)} options={[
              { value: 'ALL', label: 'Semua Kategori' },
              { value: 'Analgesik/Antipiretik', label: 'Analgesik/Antipiretik' },
              { value: 'Antibiotik', label: 'Antibiotik' },
            ]} />
          </div>
        </div>
        <DataTable data={data} columns={columns} keyExtractor={(c) => c.id} loading={false} emptyText="Belum ada cycle count" emptyIcon={<ClipboardList className="w-6 h-6" />} onRowClick={(c) => c.status === 'COMPLETED' ? router.push(`/cycle-count/report?id=${c.id}`) : router.push(`/cycle-count/count?id=${c.id}`)} />
      </Card>
    </div>
  );
}

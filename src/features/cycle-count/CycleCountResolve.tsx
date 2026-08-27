'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Card, DataTable, Select, Button, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { getCycleCount, resolveCycleCount } from './api';
import type { CycleCountItem } from '@/shared/types/domain';

const REASON_OPTIONS = [
  { value: '', label: 'Pilih alasan…' },
  { value: 'TIDAK_SESUAI', label: 'Tidak Sesuai' },
  { value: 'RUSAK', label: 'Rusak' },
  { value: 'HILANG', label: 'Hilang' },
  { value: 'KEDALUWARSA', label: 'Kedaluwarsa' },
];

export function CycleCountResolve({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<CycleCountItem[]>([]);
  const [countNumber, setCountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getCycleCount(id);
      setCountNumber(c.countNumber);
      setItems(c.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat resolusi');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setReason = (key: string, value: string) => setReasons((prev) => ({ ...prev, [key]: value }));

  const handleResolve = async () => {
    setWorking(true);
    setError(null);
    try {
      const updated = await resolveCycleCount(id, reasons);
      toast.success(`Count ${updated.countNumber} selesai`, 'Berhasil');
      router.push('/cycle-count/report?id=' + id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerapkan adjustment', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const varianceItems = items.filter((it) => (it.variance ?? 0) !== 0);

  const columns: DataTableColumn<CycleCountItem>[] = [
    { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
    { id: 'systemQty', header: 'System', align: 'right', cell: (it) => String(it.systemQty) },
    { id: 'countedQty', header: 'Counted', align: 'right', cell: (it) => String(it.countedQty ?? it.systemQty) },
    { id: 'variance', header: 'Variance', align: 'right', cell: (it) => String(it.variance ?? 0) },
    { id: 'reason', header: 'Alasan', cell: (it) => (
      <Select id={`reason-${it.productId}`} value={reasons[`${it.productId}:${it.lot}`] ?? ''} onChange={(e) => setReason(`${it.productId}:${it.lot}`, e.target.value)} options={REASON_OPTIONS} />
    ) },
  ];

  if (loading) {
    return (
      <Card title="Resolve" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Resolusi" />;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Resolve" subtitle={`No. ${countNumber} · item dengan variance untuk disesuaikan`} padding="md">
        <DataTable data={varianceItems} columns={columns} keyExtractor={(it) => `${it.productId}:${it.lot}`} emptyText="Tidak ada variance — semua cocok" />
        <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
          <Button variant="primary" isLoading={working} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleResolve}>
            Terapkan Adjustment
          </Button>
        </div>
      </Card>
    </div>
  );
}
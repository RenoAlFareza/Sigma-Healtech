'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Card, DataTable, Input, Button, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { getCycleCount, submitCount } from './api';
import type { CycleCountItem } from '@/shared/types/domain';

interface CountLine {
  productId: string;
  lot: string;
  bin: string;
  systemQty: number;
  countedQty: number;
}

export function CycleCountCount({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [lines, setLines] = useState<CountLine[]>([]);
  const [countNumber, setCountNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await getCycleCount(id);
      setCountNumber(c.countNumber);
      setLines(c.items.map((it) => ({ productId: it.productId, lot: it.lot, bin: it.bin, systemQty: it.systemQty, countedQty: it.countedQty ?? it.systemQty })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat cycle count');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (key: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.productId + ':' + l.lot === key ? { ...l, countedQty: qty } : l)));

  const handleSubmit = async () => {
    setWorking(true);
    setError(null);
    try {
      const entries = lines.map((l) => ({ productId: l.productId, lot: l.lot, countedQty: l.countedQty }));
      const updated = await submitCount(id, entries);
      toast.success(`Count ${updated.countNumber} tersimpan`, 'Berhasil');
      router.push(`/cycle-count/resolve?id=${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan count', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const columns: DataTableColumn<CountLine>[] = [
    { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
    { id: 'systemQty', header: 'System Qty', align: 'right', cell: (l) => String(l.systemQty) },
    { id: 'countedQty', header: 'Counted Qty', align: 'right', cell: (l) => (
      <Input id={`count-${l.productId}-${l.lot}`} type="number" min={0} value={String(l.countedQty)} onChange={(e) => update(`${l.productId}:${l.lot}`, Number(e.target.value))} aria-label="Counted qty" />
    ) },
  ];

  if (loading) {
    return (
      <Card title="Count" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Count" />;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Count" subtitle={`No. ${countNumber}`} padding="md">
        <DataTable data={lines} columns={columns} keyExtractor={(l) => `${l.productId}:${l.lot}`} emptyText="Tidak ada item" />
        <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
          <Button variant="primary" isLoading={working} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleSubmit}>
            Simpan Count
          </Button>
        </div>
      </Card>
    </div>
  );
}
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, DataTable, Input, Button, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { getInbound } from './api';
import type { InboundItem } from '@/shared/types/domain';

interface PutawayLine {
  productId: string;
  lot: string;
  bin: string;
}

export function Putaway({ id }: { id: string }) {
  const { toast } = useToast();
  const [lines, setLines] = useState<PutawayLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getInbound(id);
      const binned: PutawayLine[] = r.items
        .filter((it) => it.qtyReceived !== undefined && it.qtyReceived > 0)
        .map((it) => ({ productId: it.productId, lot: it.lot ?? '', bin: it.bin ?? '' }));
      setLines(binned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat putaway');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateBin = (productId: string, bin: string) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, bin } : l)));

  const handleSave = async () => {
    const missing = lines.filter((l) => !l.bin.trim());
    if (missing.length > 0) {
      toast.error('Semua baris memerlukan bin tujuan.', 'Gagal');
      return;
    }
    toast.success(`Putaway selesai untuk ${lines.length} baris.`, 'Berhasil');
  };

  const columns: DataTableColumn<PutawayLine>[] = [
    { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true },
    { id: 'lot', header: 'Lot', accessorKey: 'lot', isMono: true },
    {
      id: 'bin',
      header: 'Bin Tujuan',
      cell: (l) => <Input id={`put-${l.productId}`} value={l.bin} onChange={(e) => updateBin(l.productId, e.target.value)} isMono aria-label="Bin tujuan" />,
    },
  ];

  if (loading) {
    return (
      <Card title="Putaway" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={4} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Putaway" />;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Putaway" subtitle="Assign bin tujuan per baris yang diterima" padding="md">
        <DataTable data={lines} columns={columns} keyExtractor={(l) => l.productId} emptyText="Belum ada baris yang diterima" />
        <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
          <Button variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleSave}>
            Simpan Putaway
          </Button>
        </div>
      </Card>
    </div>
  );
}
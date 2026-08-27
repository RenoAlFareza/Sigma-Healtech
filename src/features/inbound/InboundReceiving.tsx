'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck } from 'lucide-react';
import { Card, DataTable, Input, Button, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { commitInbound, getInbound } from './api';
import type { InboundItem } from '@/shared/types/domain';

interface LineState {
  productId: string;
  qtyExpected: number;
  qtyReceived: number;
  lot: string;
  expiry: string;
  bin: string;
}

export function InboundReceiving({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();

  const [lines, setLines] = useState<LineState[]>([]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getInbound(id);
      setReceiptNumber(r.receiptNumber);
      const initial: LineState[] = r.items.map((it) => ({
        productId: it.productId,
        qtyExpected: it.qtyExpected,
        qtyReceived: it.qtyReceived ?? it.qtyExpected,
        lot: it.lot ?? '',
        expiry: it.expiry ?? '',
        bin: it.bin ?? '',
      }));
      setLines(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat penerimaan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (productId: string, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));

  const handleCommit = async () => {
    setValidationError(null);
    for (const l of lines) {
      if (!l.lot.trim() || !l.expiry.trim()) {
        setValidationError(`Line ${l.productId} memerlukan lot dan tanggal kedaluwarsa.`);
        return;
      }
    }
    if (!activeLocationId) {
      setValidationError('Lokasi tujuan tidak tersedia.');
      return;
    }
    setWorking(true);
    try {
      const items: InboundItem[] = lines.map((l) => ({
        productId: l.productId,
        qtyExpected: l.qtyExpected,
        qtyReceived: l.qtyReceived,
        lot: l.lot,
        expiry: l.expiry,
        bin: l.bin,
      }));
      const updated = await commitInbound(id, { destLocationId: activeLocationId, items });
      toast.success(`Penerimaan ${updated.receiptNumber} selesai`, 'Berhasil');
      router.push('/inbound');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerima barang', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const columns: DataTableColumn<LineState>[] = useMemo(
    () => [
      { id: 'productId', header: 'SKU', accessorKey: 'productId', isMono: true },
      { id: 'qtyExpected', header: 'Diharapkan', align: 'right', cell: (l) => String(l.qtyExpected) },
      {
        id: 'qtyReceived',
        header: 'Diterima',
        align: 'right',
        cell: (l) => (
          <Input id={`rec-${l.productId}`} type="number" min={0} value={String(l.qtyReceived)} onChange={(e) => update(l.productId, { qtyReceived: Number(e.target.value) })} aria-label="Diterima" />
        ),
      },
      {
        id: 'lot',
        header: 'Lot *',
        cell: (l) => <Input id={`lot-${l.productId}`} value={l.lot} onChange={(e) => update(l.productId, { lot: e.target.value })} isMono aria-label="Lot" />,
      },
      {
        id: 'expiry',
        header: 'Kedaluwarsa *',
        cell: (l) => <Input id={`exp-${l.productId}`} type="date" value={l.expiry} onChange={(e) => update(l.productId, { expiry: e.target.value })} isMono aria-label="Kedaluwarsa" />,
      },
      {
        id: 'bin',
        header: 'Bin',
        cell: (l) => <Input id={`bin-${l.productId}`} value={l.bin} onChange={(e) => update(l.productId, { bin: e.target.value })} isMono aria-label="Bin" />,
      },
    ],
    []
  );

  if (loading) {
    return (
      <Card title="Penerimaan Barang" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error) return <ErrorState message={error} onRetry={fetchData} title="Gagal Memuat Penerimaan" />;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Penerimaan Barang" subtitle={`No. ${receiptNumber} · Lokasi: ${activeLocationId}`} padding="md">
        <DataTable data={lines} columns={columns} keyExtractor={(l) => l.productId} emptyText="Tidak ada item" />
        {validationError && <p role="alert" className="text-sm text-error mt-3">{validationError}</p>}
        <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
          <Button variant="primary" isLoading={working} leftIcon={<PackageCheck className="w-4 h-4" />} onClick={handleCommit}>
            Terima Barang
          </Button>
        </div>
      </Card>
    </div>
  );
}
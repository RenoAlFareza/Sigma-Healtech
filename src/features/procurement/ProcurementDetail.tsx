'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PackageCheck, ArrowLeft } from 'lucide-react';
import { Card, DataTable, StatusBadge, Input, Button, Skeleton, ErrorState, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { getPO, recordPOReceipt } from './api';
import type { PurchaseOrder } from '@/shared/types/domain';

interface ReceiptLine {
  productId: string;
  productName: string;
  kfaCode: string;
  qty: number;
  qtyReceived: number;
  unitPrice: number;
}

export function ProcurementDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getPO(id);
      setPo(p);
      setLines(p.items.map((it) => ({
        productId: it.productId,
        productName: it.productId,
        kfaCode: it.productId,
        qty: it.qty,
        qtyReceived: it.qtyReceived,
        unitPrice: it.unitPrice,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat PO');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const update = (productId: string, qtyReceived: number) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qtyReceived: Math.max(0, qtyReceived) } : l)));

  const handleReceive = async () => {
    setWorking(true);
    setError(null);
    try {
      const updated = await recordPOReceipt(id, lines.map((l) => ({ productId: l.productId, qtyReceived: l.qtyReceived })));
      toast.success(`PO ${updated.poNumber} diperbarui`, 'Berhasil');
      setPo(updated);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerima PO', 'Gagal');
    } finally {
      setWorking(false);
    }
  };

  const columns: DataTableColumn<ReceiptLine>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
    { id: 'qty', header: 'Qty PO', align: 'right', cell: (l) => String(l.qty) },
    { id: 'qtyReceived', header: 'Diterima', align: 'right', cell: (l) => (
      <Input id={`pr-${l.productId}`} type="number" min={0} max={l.qty} value={String(l.qtyReceived)} onChange={(e) => update(l.productId, Number(e.target.value))} aria-label="Diterima" />
    ) },
    { id: 'unitPrice', header: 'Harga', align: 'right', cell: (l) => formatCurrency(l.unitPrice) },
  ];

  if (loading) {
    return (
      <Card title="Detail PO" padding="lg">
        <div className="flex flex-col gap-4"><Skeleton variant="rect" height={28} width="40%" count={1} /><Skeleton variant="text" height={16} count={5} /></div>
      </Card>
    );
  }
  if (error || !po) return <ErrorState message={error || 'PO tidak ditemukan'} title="Detail PO" />;

  const canReceive = po.status === 'PLACED' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={<span className="flex items-center gap-3"><span className="font-mono">{po.poNumber}</span><StatusBadge status={po.status} size="sm" /></span>}
        subtitle={`Supplier: ${po.supplierName} · Total: ${formatCurrency(po.total)}`}
        headerAction={<Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>Kembali</Button>}
        padding="md"
      >
        <DataTable data={lines} columns={columns} keyExtractor={(l) => l.productId} emptyText="Tidak ada item" />
        {canReceive ? (
          <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
            <Button variant="primary" isLoading={working} leftIcon={<PackageCheck className="w-4 h-4" />} onClick={handleReceive}>
              Catat Penerimaan
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
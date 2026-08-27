'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle2 } from 'lucide-react';
import { Card, Input, Select, Button, DataTable, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { createTransfer, completeTransfer } from './api';
import type { TransferItem } from '@/shared/types/domain';

const CATALOG = [
  { productId: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet' },
  { productId: '93012826', kfaCode: '93012826', name: 'Amoxicillin 500 mg Tablet' },
];

interface WizardItem extends Omit<TransferItem, 'lot'> {
  lot: string;
  productName: string;
  kfaCode: string;
}

export function TransferNew() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();
  const { user } = useAuth();

  const [destinationId, setDestinationId] = useState('depo-rawat-inap');
  const [items, setItems] = useState<WizardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addItem = () => {
    setError(null);
    const p = CATALOG[0];
    setItems((prev) => {
      const ex = prev.find((it) => it.productId === p.productId);
      if (ex) return prev.map((it) => (it.productId === p.productId ? { ...it, qty: it.qty + 1 } : it));
      return [...prev, { productId: p.productId, qty: 1, lot: '', productName: p.name, kfaCode: p.kfaCode }];
    });
  };

  const update = (productId: string, patch: Partial<WizardItem>) =>
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, ...patch } : it)));

  const remove = (productId: string) => setItems((prev) => prev.filter((it) => it.productId !== productId));

  const handleComplete = async () => {
    setError(null);
    if (items.length < 1) {
      setError('Minimal satu item wajib ditambahkan.');
      return;
    }
    for (const it of items) {
      if (!it.lot || !it.lot.trim()) {
        setError(`Item ${it.productName} memerlukan lot asal.`);
        return;
      }
    }
    if (!activeLocationId) {
      setError('Lokasi asal tidak tersedia.');
      return;
    }
    if (activeLocationId === destinationId) {
      setError('Lokasi asal dan tujuan harus berbeda.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTransfer({
        originId: activeLocationId,
        destinationId,
        items: items.map((it) => ({ productId: it.productId, lot: it.lot, qty: it.qty })),
      });
      const done = await completeTransfer(created.id);
      toast.success(`Transfer ${done.transferNumber} selesai`, 'Berhasil');
      router.push('/transfers');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal transfer stok', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<WizardItem>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
    { id: 'productName', header: 'Produk', accessorKey: 'productName' },
    { id: 'lot', header: 'Lot Asal', cell: (it) => <Input id={`tlot-${it.productId}`} value={it.lot} onChange={(e) => update(it.productId, { lot: e.target.value })} isMono aria-label="Lot asal" /> },
    { id: 'qty', header: 'Jumlah', align: 'right', cell: (it) => <Input id={`tqty-${it.productId}`} type="number" min={0} value={String(it.qty)} onChange={(e) => update(it.productId, { qty: Number(e.target.value) })} aria-label="Jumlah" /> },
    { id: 'actions', header: '', align: 'right', cell: (it) => <Button variant="ghost" size="sm" onClick={() => remove(it.productId)} leftIcon={<Trash2 className="w-3.5 h-3.5" />} aria-label="Hapus item" /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title="Buat Transfer Stok" subtitle="Pindahkan stok antar unit (origin → destination)" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><Input id="trf-origin" label="Asal" value={activeLocationId ?? ''} readOnly isMono /></div>
          <div>
            <Select id="trf-dest" label="Tujuan" value={destinationId} onChange={(e) => setDestinationId(e.target.value)} options={[
              { value: 'depo-rawat-inap', label: 'Depo Rawat Inap' },
              { value: 'depo-igd', label: 'Depo IGD' },
              { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan' },
            ]} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Button type="button" variant="outline" size="sm" onClick={addItem}>Tambah Item</Button>
        </div>

        <DataTable data={items} columns={columns} keyExtractor={(it) => it.productId} emptyText="Belum ada item" />

        {error && <p role="alert" className="text-sm text-error mt-3">{error}</p>}

        <div className="flex items-center justify-end mt-4 border-t border-neutral-100 pt-4">
          <Button variant="primary" isLoading={submitting} leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleComplete}>
            Selesaikan Transfer
          </Button>
        </div>
      </Card>
    </div>
  );
}
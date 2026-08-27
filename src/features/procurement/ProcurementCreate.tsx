'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Send } from 'lucide-react';
import { Card, Input, Select, Button, DataTable, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import { createPO } from './api';
import { listProducts } from '@/features/products/api';
import type { Product } from '@/shared/types/domain';

interface POLine {
  productId: string;
  productName: string;
  kfaCode: string;
  qty: number;
  unitPrice: number;
}

export function ProcurementCreate() {
  const router = useRouter();
  const { toast } = useToast();
  const [supplierName, setSupplierName] = useState('Kimia Farma');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [lines, setLines] = useState<POLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProducts({ size: 20, keyword: search || undefined })
      .then((res) => { if (!cancelled) setCatalog(res.data); })
      .catch(() => { if (!cancelled) setCatalog([]); });
    return () => { cancelled = true; };
  }, [search]);

  const addItem = (p: Product) => {
    setError(null);
    setLines((prev) => {
      const ex = prev.find((l) => l.productId === p.id);
      if (ex) return prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { productId: p.id, productName: p.name, kfaCode: p.kfaCode, qty: 1, unitPrice: p.price || 0 }];
    });
  };

  const updateQty = (productId: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(0, qty) } : l)));
  const updatePrice = (productId: string, unitPrice: number) =>
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, unitPrice: Math.max(0, unitPrice) } : l)));
  const remove = (productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId));

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const handleSubmit = async () => {
    setError(null);
    if (lines.length < 1) { setError('Minimal satu item wajib ditambahkan.'); return; }
    setSubmitting(true);
    try {
      const created = await createPO({
        supplierName,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: l.unitPrice })),
      });
      toast.success(`PO ${created.poNumber} dibuat`, 'Berhasil');
      router.push(`/procurement/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat PO', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<POLine>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
    { id: 'productName', header: 'Produk', accessorKey: 'productName' },
    { id: 'qty', header: 'Qty', align: 'right', cell: (l) => <Input id={`pqty-${l.productId}`} type="number" min={0} value={String(l.qty)} onChange={(e) => updateQty(l.productId, Number(e.target.value))} aria-label="Qty" /> },
    { id: 'unitPrice', header: 'Harga', align: 'right', cell: (l) => <Input id={`pprice-${l.productId}`} type="number" min={0} value={String(l.unitPrice)} onChange={(e) => updatePrice(l.productId, Number(e.target.value))} aria-label="Harga satuan" /> },
    { id: 'subtotal', header: 'Subtotal', align: 'right', cell: (l) => formatCurrency(l.qty * l.unitPrice) },
    { id: 'actions', header: '', align: 'right', cell: (l) => <Button variant="ghost" size="sm" onClick={() => remove(l.productId)} leftIcon={<Trash2 className="w-3.5 h-3.5" />} aria-label="Hapus item" /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title="Buat Purchase Order" subtitle="Pesanan pembelian ke supplier" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Input id="po-supplier" label="Supplier" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-end mb-3">
          <div className="flex-1 md:max-w-sm">
            <Input id="po-search" label="Cari Produk (KFA)" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nama atau SKU…" />
          </div>
          <div className="flex gap-2">
            {catalog.slice(0, 5).map((p) => (
              <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addItem(p)}>
                <span className="font-mono">{p.kfaCode}</span>
              </Button>
            ))}
          </div>
        </div>

        <DataTable data={lines} columns={columns} keyExtractor={(l) => l.productId} emptyText="Belum ada item" />

        <div className="flex items-center justify-between mt-4 border-t border-neutral-100 pt-4">
          <span className="text-sm text-muted">Total: <span className="font-mono font-medium text-text-main">{formatCurrency(total)}</span></span>
          <Button variant="primary" isLoading={submitting} leftIcon={<Send className="w-4 h-4" />} onClick={handleSubmit}>
            Buat PO
          </Button>
        </div>
        {error && <p role="alert" className="text-sm text-error mt-2">{error}</p>}
      </Card>
    </div>
  );
}
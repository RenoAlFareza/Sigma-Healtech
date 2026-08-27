'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Send } from 'lucide-react';
import { Card, Button, Select, Input, DataTable, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { createRequisition } from './api';
import { listProducts } from '@/features/products/api';
import type { Product } from '@/shared/types/domain';
import type { RequisitionItem, RequisitionPriority } from '@/shared/types/domain';

interface LineItem extends RequisitionItem {
  productName: string;
  kfaCode: string;
}

export function RequisitionCreate() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();
  const { user } = useAuth();

  const [priority, setPriority] = useState<RequisitionPriority>('RUTIN');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load the real KFA product catalog for the line-item picker.
  useEffect(() => {
    let cancelled = false;
    listProducts({ size: 20, keyword: search || undefined })
      .then((res) => {
        if (!cancelled) setCatalog(res.data);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filteredCatalog = useMemo(() => catalog, [catalog]);

  const addItem = useCallback(
    (product: Product) => {
      setValidationError(null);
      setItems((prev) => {
        const existing = prev.find((it) => it.productId === product.id);
        if (existing) {
          return prev.map((it) =>
            it.productId === product.id ? { ...it, qtyRequested: it.qtyRequested + 1 } : it
          );
        }
        return [
          ...prev,
          { productId: product.id, qtyRequested: 1, productName: product.name, kfaCode: product.kfaCode },
        ];
      });
    },
    []
  );

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, qtyRequested: Math.max(0, qty) } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const columns: DataTableColumn<LineItem>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true, width: '110px' },
    { id: 'productName', header: 'Produk', accessorKey: 'productName' },
    {
      id: 'qty',
      header: 'Jumlah',
      align: 'right',
      cell: (it) => (
        <Input
          id={`qty-${it.productId}`}
          type="number"
          min={0}
          value={String(it.qtyRequested)}
          onChange={(e) => updateQty(it.productId, Number(e.target.value))}
          aria-label="Jumlah"
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (it) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeItem(it.productId)}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          aria-label="Hapus item"
        />
      ),
    },
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length < 1) {
      setValidationError('Minimal satu item wajib ditambahkan.');
      return;
    }
    if (!activeLocationId) {
      setValidationError('Lokasi asal tidak tersedia.');
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    try {
      const payload = {
        originId: activeLocationId,
        destinationId: 'wh-pusat',
        priority,
        requestedBy: user?.id,
        items: items.map((it) => ({
          productId: it.productId,
          qtyRequested: it.qtyRequested,
        })),
      };
      const created = await createRequisition(payload);
      toast.success('Permintaan berhasil dikirim', 'Berhasil');
      router.push(`/requisitions/${created.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim permintaan', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const itemCount = items.reduce((sum, it) => sum + (it.qtyRequested >= 0 ? it.qtyRequested : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Buat Permintaan Stok" subtitle="Permintaan dari unit ke gudang" padding="md">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input id="origin" label="Unit Asal" value={activeLocationId ?? ''} readOnly isMono />
            </div>
            <div>
              <Input id="destination" label="Unit Tujuan" value="wh-pusat" readOnly isMono />
            </div>
            <div>
              <Select
                id="priority"
                label="Prioritas"
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                options={[
                  { value: 'RUTIN', label: 'Rutin' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1 md:max-w-sm">
                <Input
                  id="product-search"
                  label="Cari Produk"
                  placeholder="Nama atau SKU produk…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    const match = filteredCatalog[0];
                    if (match) addItem(match);
                  }}
                >
                  Tambah Item
                </Button>
              </div>
            </div>

            {filteredCatalog.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {filteredCatalog.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-main text-xs hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-mono">{p.kfaCode}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DataTable
            data={items}
            columns={columns}
            keyExtractor={(it) => it.productId}
            emptyText="Belum ada item — tambahkan minimal satu produk"
          />

          {validationError && (
            <p role="alert" className="text-sm text-error flex items-center gap-1.5">
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
            <span className="text-sm text-muted">
              Total item: <span className="font-mono font-medium text-text-main">{itemCount}</span>
            </span>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Kirim Permintaan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
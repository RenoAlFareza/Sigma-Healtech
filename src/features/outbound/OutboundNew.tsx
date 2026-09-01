'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Download,
  Package,
  Plus,
  Send,
  Trash2,
  Truck,
} from 'lucide-react';
import { Button, Card, DataTable, FormWizard, Input, Select, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatNumber, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { fefoPick } from './fefo';
import { listInventory } from '@/features/inventory/api';
import { listProducts } from '@/features/products/api';
import type { Product } from '@/shared/types/domain';
import { createOutbound, transitionOutboundStatus } from './api';
import type { MovementItem } from '@/shared/types/domain';

interface WizardItem extends MovementItem {
  productName: string;
  kfaCode: string;
}

export function OutboundNew() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();
  const { user } = useAuth();

  const [type, setType] = useState('REPLENISHMENT');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [items, setItems] = useState<WizardItem[]>([]);
  const [stockError, setStockError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Load KFA product catalog for the picker.
  useEffect(() => {
    let cancelled = false;
    listProducts({ size: 100, keyword: search || undefined })
      .then((res) => {
        if (!cancelled) setCatalog(res.data.slice(0, 20));
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [search]);

  const filteredCatalog = useMemo(() => catalog, [catalog]);

  const addItem = (p: Product) => {
    setStockError(null);
    setItems((prev) => {
      const ex = prev.find((it) => it.productId === p.id);
      if (ex) return prev.map((it) => (it.productId === p.id ? { ...it, qty: it.qty + 1 } : it));
      return [...prev, { productId: p.id, qty: 1, productName: p.name, kfaCode: p.kfaCode }];
    });
  };

  const updateQty = (productId: string, qty: number) =>
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, qty: Math.max(0, qty) } : it)));

  const removeItem = (productId: string) => setItems((prev) => prev.filter((it) => it.productId !== productId));

  /** Check FEFO availability for all items against active location stock. */
  async function validateStock(): Promise<boolean> {
    if (items.length < 1) {
      setStockError('Minimal satu item wajib ditambahkan.');
      return false;
    }
    if (!activeLocationId) {
      setStockError('Lokasi asal tidak tersedia.');
      return false;
    }
    for (const it of items) {
      const inv = await listInventory({ locationId: activeLocationId, keyword: it.productId, size: 100 });
      const lots = inv.data.map((l) => ({ lot: l.lot, expiry: l.expiry, qtyOnHand: l.qtyOnHand, bin: l.bin }));
      const pick = fefoPick(lots, it.qty);
      if (!pick.ok) {
        setStockError(`Stok tidak cukup untuk ${it.productName} (${it.kfaCode}).`);
        return false;
      }
    }
    setStockError(null);
    return true;
  }

  async function handleCreate() {
    if (items.length < 1) {
      setStockError('Minimal satu item wajib ditambahkan.');
      return;
    }
    if (!activeLocationId) {
      setStockError('Lokasi asal tidak tersedia.');
      return;
    }
    setSubmitting(true);
    setStockError(null);
    try {
      const created = await createOutbound({
        originId: activeLocationId,
        destinationId: 'depo-rawat-inap',
        type,
        items: items.map((it) => ({ productId: it.productId, qty: it.qty })),
      });
      setCreatedId(created.id);
      // Move through ITEMS → PICKING → dispatch.
      await transitionOutboundStatus(created.id, 'PICKING');
      const disp = await transitionOutboundStatus(created.id, 'DISPATCHED');
      toast.success(`Pengeluaran ${disp.movementNumber} berhasil dikirim dan stok gudang didebit.`, 'Berhasil');
      router.push('/outbound');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat outbound', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataTableColumn<WizardItem>[] = [
    { id: 'kfaCode', header: 'SKU', accessorKey: 'kfaCode', isMono: true },
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
          value={String(it.qty)}
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

  const hasItems = items.length > 0;

  const steps = [
    {
      id: 'header',
      title: 'Header',
      description: 'Jenis & tujuan pengiriman',
      isValid: true,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input id="ob-origin" label="Unit Asal" value={activeLocationId ?? ''} readOnly isMono />
          </div>
          <div>
            <Input id="ob-dest" label="Unit Tujuan" value="depo-rawat-inap" readOnly isMono />
          </div>
          <div>
            <Select
              id="ob-type"
              label="Jenis"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'REPLENISHMENT', label: 'Replenishment (Restock Rutin)' },
                { value: 'REQUISITION', label: 'Requisition (Permintaan Unit)' },
              ]}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'items',
      title: 'Items',
      description: 'Pilih produk & jumlah',
      isValid: hasItems,
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 md:max-w-sm">
              <Input
                id="ob-search"
                label="Cari Produk"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama atau SKU…"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCatalog.slice(0, 3).map((p) => (
                <Button key={p.id} type="button" variant="outline" size="sm" onClick={() => addItem(p)}>
                  <span className="font-mono">{p.kfaCode}</span>
                </Button>
              ))}
            </div>
          </div>
          <DataTable data={items} columns={columns} keyExtractor={(it) => it.productId} emptyText="Belum ada item" />
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Validasi stok (FEFO)',
      isValid: validateStock,
      content: (
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-[#1b2a24]">
            Memeriksa ketersediaan stok fisik gudang untuk {items.length} item.
          </div>
          {stockError && <p role="alert" className="text-sm font-semibold text-rose-600">{stockError}</p>}
          {!stockError && hasItems && (
            <p className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
              ✓ Stok mencukupi — sistem siap mengalokasikan batch FEFO (First-Expired, First-Out).
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'pick',
      title: 'Pick (FEFO)',
      description: 'Alokasi lot kedaluwarsa tercepat',
      isValid: true,
      content: (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-[#52665d]">
            Sistem secara otomatis mengalokasikan batch/lot obat dengan tanggal kedaluwarsa terdekat (*First-Expired, First-Out*):
          </div>
          <div className="divide-y divide-[#edf1ee] rounded-xl border border-[#dfe6e2] bg-white">
            {items.map((it) => (
              <div key={it.productId} className="flex items-center justify-between p-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-[#2d6a4f] mr-2">{it.kfaCode}</span>
                  <span className="font-semibold text-[#1b2a24]">{it.productName}</span>
                </div>
                <span className="font-mono font-bold text-[#1b2a24]">{formatQuantity(it.qty)} Unit</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'pack',
      title: 'Pack',
      description: 'Kemas barang',
      isValid: true,
      content: (
        <div className="rounded-xl border border-[#dfe6e2] bg-[#f8faf9] p-4 text-xs space-y-2">
          <div className="font-bold text-[#1b2a24]">Pengelompokan Kemasan Koli (Container/Box):</div>
          <p className="text-[#52665d]">
            Barang telah dikelompokkan ke dalam box pengiriman terstandar dan siap disegel untuk dikirim ke unit pemohon.
          </p>
        </div>
      ),
    },
    {
      id: 'dispatch',
      title: 'Dispatch',
      description: 'Kirim & debit stok',
      isValid: true,
      content: (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs space-y-2">
          <div className="font-bold text-emerald-900">Konfirmasi Pengeluaran & Penerbitan Surat Jalan:</div>
          <p className="text-emerald-800">
            Setelah menekan tombol kirim di bawah, saldo persediaan fisik di Gudang Farmasi Pusat akan dipotong otomatis dan tercatat pada Buku Besar Kartu Stok (Electronic Stock Card).
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/outbound"
        className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] w-fit"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Daftar Outbound
      </Link>

      <Card
        title="Buat Pengeluaran FEFO (Outbound Wizard)"
        subtitle="Alur terstruktur 6-langkah pengeluaran barang keluar gudang berbasis FEFO"
        padding="lg"
      >
        <FormWizard
          steps={steps}
          onComplete={handleCreate}
          isSubmitting={submitting}
          submitLabel="Kirim Outbound"
        />
      </Card>
    </div>
  );
}
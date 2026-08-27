'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, DataTable, StatusBadge, Tabs, Skeleton, ErrorState, EmptyState } from '@/shared/ui';
import type { DataTableColumn, TabItem } from '@/shared/ui';
import { formatDate, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getStockCard } from './api';
import type { StockCard as StockCardData, StockCardItem } from './api';
import type { StockTransaction } from '@/shared/types/domain';

export function StockCard() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const { activeLocationId } = useActiveLocation();

  const [data, setData] = useState<StockCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !activeLocationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getStockCard(productId, activeLocationId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat kartu stok');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, activeLocationId]);

  if (loading) {
    return (
      <Card title="Kartu Stok" padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Produk tidak ditemukan'} title="Kartu Stok" />;
  }

  const lotColumns: DataTableColumn<StockCardItem>[] = [
    { id: 'lot', header: 'No. Lot', accessorKey: 'lot', isMono: true },
    { id: 'expiry', header: 'Kadaluarsa', cell: (it) => formatDate(it.expiry, 'iso'), isMono: true },
    { id: 'bin', header: 'Bin', accessorKey: 'bin', isMono: true },
    {
      id: 'qtyOnHand',
      header: 'QoH',
      align: 'right',
      cell: (it) => formatQuantity(it.qtyOnHand),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (it) => <StatusBadge status={it.status} size="sm" />,
    },
  ];

  const txColumns: DataTableColumn<StockTransaction>[] = [
    { id: 'date', header: 'Tanggal', accessorKey: 'date', isMono: true },
    { id: 'type', header: 'Tipe', accessorKey: 'type' },
    {
      id: 'qtyIn',
      header: 'Masuk',
      align: 'right',
      cell: (tx) => (tx.qtyIn ? formatQuantity(tx.qtyIn) : '—'),
    },
    {
      id: 'qtyOut',
      header: 'Keluar',
      align: 'right',
      cell: (tx) => (tx.qtyOut ? formatQuantity(tx.qtyOut) : '—'),
    },
    {
      id: 'balance',
      header: 'Saldo',
      align: 'right',
      cell: (tx) => formatQuantity(tx.balance),
    },
    { id: 'user', header: 'User', accessorKey: 'user' },
    { id: 'reference', header: 'Referensi', accessorKey: 'reference' },
  ];

  const tabs: TabItem[] = [
    {
      id: 'lots',
      label: 'Lot / Batch',
      count: data.items.length,
      content:
        data.items.length === 0 ? (
          <EmptyState title="Tidak ada lot" description="Belum ada batch untuk produk ini di lokasi aktif." />
        ) : (
          <DataTable
            data={data.items}
            columns={lotColumns}
            keyExtractor={(it) => it.lot}
          />
        ),
    },
    {
      id: 'history',
      label: 'Riwayat Transaksi',
      count: data.transactions.length,
      content:
        data.transactions.length === 0 ? (
          <EmptyState title="Belum ada transaksi" />
        ) : (
          <DataTable
            data={data.transactions}
            columns={txColumns}
            keyExtractor={(tx) => `${tx.date}-${tx.reference ?? tx.type}`}
          />
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card
        title={data.product.name}
        subtitle={`KFA: ${data.product.kfaCode} · Zat Aktif: ${data.product.zatAktif} · NIE: ${data.product.nie}`}
        padding="md"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-muted uppercase tracking-wider font-semibold">Kekuatan</div>
            <div className="mt-1">{data.product.kekuatan || '—'}</div>
          </div>
          <div>
            <div className="text-muted uppercase tracking-wider font-semibold">Bentuk Sediaan</div>
            <div className="mt-1">{data.product.dosageForm || '—'}</div>
          </div>
          <div>
            <div className="text-muted uppercase tracking-wider font-semibold">Produsen</div>
            <div className="mt-1">{data.product.manufacturer || '—'}</div>
          </div>
          <div>
            <div className="text-muted uppercase tracking-wider font-semibold">Kategori</div>
            <div className="mt-1">{data.product.category || '—'}</div>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <Tabs items={tabs} defaultTabId="lots" />
      </Card>
    </div>
  );
}
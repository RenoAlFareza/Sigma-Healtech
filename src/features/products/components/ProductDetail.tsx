'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Card, StatusBadge, Button, Skeleton, ErrorState } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import type { Product } from '@/shared/types/domain';
import { getProduct } from '../api';
import { useAuth } from '@/features/auth/AuthProvider';

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-neutral-100 last:border-0">
      <dt className="w-40 shrink-0 text-xs font-semibold text-muted uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className={`text-sm text-text-main ${mono ? 'font-mono font-medium' : ''}`}>{value}</dd>
    </div>
  );
}

export function ProductDetail({ productId, initialProduct }: { productId: string; initialProduct?: Product }) {
  const { role } = useAuth();
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProduct(productId)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, initialProduct]);

  if (loading) {
    return (
      <Card title="Product Detail" padding="md">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  if (error || !product) {
    return (
      <ErrorState
        title="Product not found"
        message={error || 'The requested product could not be loaded.'}
      />
    );
  }

  return (
    <Card
      title={product.name}
      subtitle={product.category}
      padding="md"
      headerAction={
        <div className="flex items-center gap-2">
          <StatusBadge status="ACTIVE" size="sm" />
          {role === 'ADMIN' && (
            <a href={`/products/${product.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={<Pencil className="w-4 h-4" />}>
                Edit
              </Button>
            </a>
          )}
        </div>
      }
    >
      <dl className="divide-y divide-neutral-100">
        <DetailRow label="KFA Code" value={product.kfaCode} mono />
        <DetailRow label="Nama Produk" value={product.name} />
        <DetailRow label="Zat Aktif" value={product.zatAktif} />
        <DetailRow label="Kekuatan" value={product.kekuatan} />
        <DetailRow label="Sediaan" value={product.dosageForm} />
        <DetailRow label="NIE" value={product.nie} mono />
        <DetailRow label="Produsen" value={product.manufacturer} />
        <DetailRow label="Harga" value={formatCurrency(product.price)} />
        <DetailRow label="Satuan" value={product.uom} />
        <DetailRow label="Kategori" value={product.category} />
      </dl>

      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => window.history.back()}
        >
          Back to list
        </Button>
      </div>
    </Card>
  );
}

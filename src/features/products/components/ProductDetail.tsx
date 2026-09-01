'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Database,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  Package,
  Pencil,
  Pill,
  RefreshCw,
  ShieldAlert,
  Snowflake,
  Thermometer,
  Warehouse,
} from 'lucide-react';
import { Button, Card, ErrorState, Skeleton, StatusBadge } from '@/shared/ui';
import { formatCurrency } from '@/shared/lib/format';
import type { Product } from '@/shared/types/domain';
import { getProduct } from '../api';
import { useAuth } from '@/features/auth/AuthProvider';

export function ProductDetail({
  productId,
  initialProduct,
}: {
  productId: string;
  initialProduct?: Product;
}) {
  const router = useRouter();
  const { role } = useAuth();
  const canEdit = role === 'ADMIN';

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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat detail produk');
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
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-[#9ca8a2]" />
        <p className="text-sm text-[#52665d]">{error || 'Produk obat tidak ditemukan'}</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b4332]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const isColdChain =
    product.name.toLowerCase().includes('injeksi') ||
    product.name.toLowerCase().includes('insulin') ||
    product.name.toLowerCase().includes('vaksin') ||
    product.category.toLowerCase().includes('vaksin');

  const isHighAlert =
    product.name.toLowerCase().includes('injeksi') ||
    product.name.toLowerCase().includes('morfin') ||
    product.name.toLowerCase().includes('heparin') ||
    product.name.toLowerCase().includes('kalium');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── 1. Breadcrumb Navigation ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Katalog Produk
          </Link>
          <span className="text-xs text-[#9ca8a2]">/</span>
          <span className="text-xs font-mono font-bold text-[#2d6a4f]">{product.kfaCode}</span>
        </div>

        {canEdit && (
          <Link
            href={`/products/${product.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2d6a4f] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1b4332]"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Master Produk
          </Link>
        )}
      </div>

      {/* ── 2. Master Product Header Card ── */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_12px_rgba(27,42,36,0.06)] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-[#edf1ee] bg-gradient-to-r from-[#f8faf9] to-white gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#d8f3dc] p-3.5 text-[#2d6a4f]">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f8f4] px-2 py-0.5 text-xs font-mono font-bold text-[#2d6a4f]">
                  KFA: {product.kfaCode}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-[#52665d]">
                  NIE: {product.nie || '-'}
                </span>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>
              <h1 className="text-lg md:text-xl font-black text-[#1b2a24] mt-1.5">
                {product.name}
              </h1>
              <p className="text-xs text-[#52665d] mt-0.5">
                {product.category} • {product.dosageForm || 'Sediaan Farmasi'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-1 bg-[#f8faf9] md:bg-transparent p-3 md:p-0 rounded-xl">
            <span className="text-[11px] font-semibold text-[#52665d]">Harga Acuan HET Kemenkes:</span>
            <span className="text-xl font-black font-mono text-[#2d6a4f]">
              {product.price != null && product.price > 0 ? formatCurrency(product.price) : 'Rp 0'}
            </span>
            <span className="text-[10px] text-[#9ca8a2]">per {product.uom || 'Satuan'}</span>
          </div>
        </div>

        {/* Quick Spec Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#edf1ee]">
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-[#52665d] uppercase tracking-wider block">
              Zat Aktif / Molekul
            </span>
            <p className="text-xs font-bold text-[#1b2a24]">{product.zatAktif}</p>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-[#52665d] uppercase tracking-wider block">
              Kekuatan Dosis
            </span>
            <p className="text-xs font-bold text-[#1b2a24]">{product.kekuatan || '-'}</p>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-[#52665d] uppercase tracking-wider block">
              Produsen Farmasi
            </span>
            <p className="text-xs font-bold text-[#1b2a24]">{product.manufacturer || '-'}</p>
          </div>
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-semibold text-[#52665d] uppercase tracking-wider block">
              Satuan Terkecil (UOM)
            </span>
            <p className="text-xs font-bold text-[#2d6a4f]">{product.uom || 'Pcs'}</p>
          </div>
        </div>
      </div>

      {/* ── 3. Structured 3-Bento Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Identitas & Nomenklatur */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <Database className="w-4 h-4 text-[#2d6a4f]" />
            1. Identitas & Nomenklatur KFA
          </div>
          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Kode KFA Terstandar</dt>
              <dd className="font-mono font-bold text-[#2d6a4f] mt-0.5">{product.kfaCode}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Nama Resmi Dagang</dt>
              <dd className="font-semibold text-[#1b2a24] mt-0.5">{product.name}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Zat Aktif / Generik</dt>
              <dd className="text-[#1b2a24] mt-0.5">{product.zatAktif}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Nomor Izin Edar (NIE BPOM)</dt>
              <dd className="font-mono text-[#1b2a24] mt-0.5">{product.nie || '-'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Pabrik / Produsen</dt>
              <dd className="text-[#1b2a24] mt-0.5">{product.manufacturer || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Card 2: Karakteristik Farmasi */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <Layers className="w-4 h-4 text-[#2d6a4f]" />
            2. Karakteristik & Kemasan
          </div>
          <dl className="space-y-3 text-xs">
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Kategori Terapeutik</dt>
              <dd className="font-semibold text-[#1b2a24] mt-0.5">{product.category}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Bentuk Sediaan Fisik</dt>
              <dd className="text-[#1b2a24] mt-0.5">{product.dosageForm || '-'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Kekuatan Dosis</dt>
              <dd className="text-[#1b2a24] mt-0.5">{product.kekuatan || '-'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Satuan Terkecil (Base UOM)</dt>
              <dd className="font-bold text-[#2d6a4f] mt-0.5">{product.uom || 'Pcs'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold text-[#52665d]">Harga Acuan HET Kemenkes</dt>
              <dd className="font-mono font-bold text-[#1b2a24] mt-0.5">
                {product.price != null && product.price > 0 ? formatCurrency(product.price) : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card 3: Keamanan Klinis & Suhu */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <ShieldAlert className="w-4 h-4 text-[#2d6a4f]" />
            3. Penanganan & Keamanan
          </div>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[#edf1ee] p-3 bg-[#f8faf9] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#1b2a24]">
                {isColdChain ? (
                  <>
                    <Snowflake className="w-4 h-4 text-sky-600" />
                    Cold Chain (2–8°C)
                  </>
                ) : (
                  <>
                    <Thermometer className="w-4 h-4 text-[#2d6a4f]" />
                    Suhu Kamar Terkontrol (15–25°C)
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#6b7c74]">
                {isColdChain
                  ? 'Simpan di dalam lemari pendingin farmasi berstandar kalibrasi suhu berkala.'
                  : 'Simpan di rak gudang terlindung dari cahaya langsung dan kelembaban tinggi.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8faf9]">
                <span className="text-[11px] font-semibold text-[#52665d]">Kategori High Alert</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    isHighAlert
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isHighAlert ? 'YA (High Alert)' : 'Standar'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8faf9]">
                <span className="text-[11px] font-semibold text-[#52665d]">Peringatan LASA</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Normal
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-[#f8faf9]">
                <span className="text-[11px] font-semibold text-[#52665d]">Status Kepatuhan KFA</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Terverifikasi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

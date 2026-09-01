'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import { Button, Card, Input, Select, useToast } from '@/shared/ui';
import { formatCurrency, formatNumber } from '@/shared/lib/format';
import { createPO } from './api';
import { listProducts } from '@/features/products/api';
import type { Product } from '@/shared/types/domain';

interface POLineItem {
  productId: string;
  productName: string;
  kfaCode: string;
  unit: string;
  qty: number;
  unitPrice: number;
}

const COMMON_SUPPLIERS = [
  'PT Kimia Farma Trading & Distribution',
  'PT Kalbe Farma Tbk',
  'PT Anugrah Argon Medica',
  'PT Afifarma Farma',
  'PT Tempo Scan Pacific',
];

export function ProcurementCreate() {
  const router = useRouter();
  const { toast } = useToast();

  // Section 1: Header States
  const [supplierName, setSupplierName] = useState('PT Kimia Farma Trading & Distribution');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [etaDate, setEtaDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [paymentTerms, setPaymentTerms] = useState('CREDIT_30');
  const [deliveryNotes, setDeliveryNotes] = useState('Penanganan standar farmasi suhu kamar (15–25°C).');

  // Section 2: Items & Catalog States
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [lines, setLines] = useState<POLineItem[]>([]);

  // Section 3: Financial & Submission States
  const [applyPpn, setApplyPpn] = useState(true);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const addItem = (p: Product) => {
    setError(null);
    setLines((prev) => {
      const ex = prev.find((l) => l.productId === p.id);
      if (ex) {
        return prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + 10 } : l));
      }
      return [
        ...prev,
        {
          productId: p.id,
          productName: p.name,
          kfaCode: p.kfaCode,
          unit: p.uom || 'Tablet',
          qty: 50,
          unitPrice: p.price || 1000,
        },
      ];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l))
    );
  };

  const updatePrice = (productId: string, unitPrice: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, unitPrice: Math.max(0, unitPrice) } : l))
    );
  };

  const updateUnit = (productId: string, unit: string) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, unit } : l))
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  // Financial Computations
  const subtotal = useMemo(() => {
    return lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  }, [lines]);

  const ppnAmount = useMemo(() => {
    return applyPpn ? Math.round(subtotal * 0.11) : 0;
  }, [subtotal, applyPpn]);

  const totalPo = useMemo(() => {
    return subtotal + ppnAmount + (shippingFee || 0);
  }, [subtotal, ppnAmount, shippingFee]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!supplierName.trim()) {
      setError('Nama distributor/pemasok wajib diisi.');
      return;
    }
    if (lines.length < 1) {
      setError('Minimal satu item obat wajib ditambahkan dalam daftar pesanan.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createPO({
        supplierName,
        items: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
      });
      toast.success(`Purchase Order ${created.poNumber} berhasil diterbitkan`, 'Berhasil');
      router.push(`/procurement/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat PO';
      setError(msg);
      toast.error(msg, 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/procurement"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar PO
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Buat Purchase Order Baru
          </h1>
          <p className="text-xs text-[#52665d] mt-0.5">
            Penerbitan surat pesanan resmi pengadaan obat ke distributor Pedagang Besar Farmasi (PBF).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/procurement')}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Terbitkan Purchase Order
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700" role="alert">
          {error}
        </div>
      )}

      {/* Bagian 1: Header & Distributor PBF */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2d6a4f] border-b border-[#edf1ee] pb-3">
          <Building2 className="h-4 w-4 text-[#2d6a4f]" />
          Bagian 1: Informasi Dokumen & Distributor PBF
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="po-supplier-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Distributor / Pemasok Farmasi (PBF) <span className="text-rose-500">*</span>
            </label>
            <input
              id="po-supplier-input"
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ketik nama PBF atau pilih saran..."
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3.5 py-2.5 text-xs text-[#1b2a24] font-medium transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_SUPPLIERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSupplierName(s)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                    supplierName === s
                      ? 'bg-[#e8f5e9] text-[#1b4332] border-[#a5d6a7] font-bold'
                      : 'bg-white text-[#52665d] border-[#e0e7e3] hover:bg-[#f1f5f3]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Gudang Tujuan Penerimaan
            </label>
            <input
              type="text"
              disabled
              value="Gudang Farmasi Pusat (Central Medical Depot)"
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f1f5f3] px-3.5 py-2.5 text-xs text-[#52665d] font-semibold cursor-not-allowed"
            />
            <p className="text-[10px] text-[#6b7c74] mt-1">
              Barang yang tiba dari PO ini akan diverifikasi melalui Inbound Gudang Pusat.
            </p>
          </div>

          <div>
            <label htmlFor="po-order-date" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Tanggal Pemesanan
            </label>
            <input
              id="po-order-date"
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3.5 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="po-eta-date" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Estimasi Tanggal Tiba (ETA)
            </label>
            <input
              id="po-eta-date"
              type="date"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3.5 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="po-payment-terms" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Syarat Pembayaran (Payment Terms)
            </label>
            <select
              id="po-payment-terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3.5 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            >
              <option value="CREDIT_30">Kredit Tempo 30 Hari</option>
              <option value="CREDIT_60">Kredit Tempo 60 Hari</option>
              <option value="COD">Cash On Delivery (COD)</option>
              <option value="ADVANCE">Bayar di Muka / Transfer</option>
            </select>
          </div>

          <div>
            <label htmlFor="po-notes" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Instruksi Penanganan & Suhu
            </label>
            <input
              id="po-notes"
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Contoh: Cold Chain 2–8°C..."
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3.5 py-2 text-xs text-[#1b2a24] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bagian 2: Pemilihan & Input SKU Obat KFA */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#edf1ee] pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2d6a4f]">
            <Package className="h-4 w-4 text-[#2d6a4f]" />
            Bagian 2: Pemilihan & Input Item Obat (KFA)
          </div>
          <span className="text-xs font-semibold text-[#52665d]">
            {lines.length} SKU terdaftar
          </span>
        </div>

        {/* Live Catalog Search & Quick Chips */}
        <div className="space-y-2 bg-[#f8faf9] border border-[#dfe6e2] p-4 rounded-xl">
          <label htmlFor="catalog-search-input" className="block text-xs font-semibold text-[#52665d]">
            Cari Produk dari Master Data KFA
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca8a2]" />
            <input
              id="catalog-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama obat atau kode KFA (contoh: Paracetamol, 93000462)..."
              className="w-full rounded-xl border border-[#dfe6e2] bg-white py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
            />
          </div>

          <div className="pt-2">
            <div className="text-[11px] font-semibold text-[#6b7c74] mb-1.5">Rekomendasi Cepat Obat:</div>
            <div className="flex flex-wrap gap-1.5">
              {catalog.slice(0, 6).map((p) => {
                const isSelected = lines.some((l) => l.productId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? 'bg-[#e8f5e9] border-[#a5d6a7] text-[#1b4332]'
                        : 'bg-white border-[#dfe6e2] text-[#2d6a4f] hover:bg-[#f1f8f4]'
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>{p.name}</span>
                    <span className="font-mono text-[10px] text-[#6b7c74]">({p.kfaCode})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Lines Table */}
        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#dfe6e2] p-8 text-center text-xs text-[#6b7c74]">
            Belum ada obat yang ditambahkan. Gunakan kolom pencarian di atas untuk menambahkan item ke PO.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                  <th className="py-2.5 px-3 w-10 text-center">No.</th>
                  <th className="py-2.5 px-3">Kode KFA</th>
                  <th className="py-2.5 px-3">Nama Obat</th>
                  <th className="py-2.5 px-3 w-28 text-center">Satuan Kemasan</th>
                  <th className="py-2.5 px-3 w-28 text-right">Kuantitas</th>
                  <th className="py-2.5 px-3 w-36 text-right">Harga Beli Satuan (Rp)</th>
                  <th className="py-2.5 px-3 w-36 text-right">Subtotal</th>
                  <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {lines.map((l, idx) => (
                  <tr key={l.productId} className="transition hover:bg-[#f1f8f4]">
                    <td className="py-2.5 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#2d6a4f]">{l.kfaCode}</td>
                    <td className="py-2.5 px-3 font-medium text-[#1b2a24]">{l.productName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={l.unit}
                        onChange={(e) => updateUnit(l.productId, e.target.value)}
                        className="rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Box">Box</option>
                        <option value="Botol">Botol</option>
                        <option value="Strip">Strip</option>
                        <option value="Vial">Vial</option>
                        <option value="Ampul">Ampul</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="1"
                        value={l.qty}
                        onChange={(e) => updateQty(l.productId, Number(e.target.value))}
                        className="w-24 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-bold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        value={l.unitPrice}
                        onChange={(e) => updatePrice(l.productId, Number(e.target.value))}
                        className="w-32 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-mono font-medium text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#1b2a24]">
                      {formatCurrency(l.qty * l.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(l.productId)}
                        className="text-rose-500 hover:text-rose-700 transition p-1"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bagian 3: Ringkasan Finansial, Pajak & Otorisasi */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#2d6a4f] border-b border-[#edf1ee] pb-3">
          <DollarSign className="h-4 w-4 text-[#2d6a4f]" />
          Bagian 3: Ringkasan Finansial & Otorisasi Pemesanan
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-3">
            <div>
              <label htmlFor="po-notes-memo" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Catatan Internal / Justifikasi Pengadaan
              </label>
              <textarea
                id="po-notes-memo"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan untuk persetujuan manajer / PBF..."
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] p-3 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#f8faf9] border border-[#dfe6e2] p-3.5 rounded-xl">
              <input
                id="toggle-ppn"
                type="checkbox"
                checked={applyPpn}
                onChange={(e) => setApplyPpn(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <label htmlFor="toggle-ppn" className="text-xs font-medium text-[#1b2a24] cursor-pointer">
                Kenakan Pajak Pertambahan Nilai (PPN Farmasi 11%)
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-[#dfe6e2] bg-[#f8faf9] p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-[#52665d]">
              <span>Subtotal Nilai Pokok:</span>
              <span className="font-mono font-semibold text-[#1b2a24]">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between text-[#52665d]">
              <span>PPN Farmasi (11%):</span>
              <span className="font-mono font-semibold text-[#1b2a24]">{formatCurrency(ppnAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-[#52665d]">
              <span>Estimasi Biaya Pengiriman:</span>
              <input
                type="number"
                min="0"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-28 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-mono font-semibold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
              />
            </div>

            <div className="border-t border-[#dfe6e2] pt-3 flex justify-between items-center text-sm font-bold text-[#1b4332]">
              <span>Total Nilai Bersih PO:</span>
              <span className="text-lg font-black text-[#2d6a4f] font-mono">{formatCurrency(totalPo)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#edf1ee] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#6b7c74]">
            Dengan menerbitkan PO ini, dokumen akan dikirimkan dan masuk ke antrean pemantauan status pengiriman.
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/procurement')}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Terbitkan Purchase Order
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
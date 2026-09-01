'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  Package,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button, Input, Select, useToast } from '@/shared/ui';
import { formatNumber, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { useAuth } from '@/features/auth/AuthProvider';
import { createRequisition } from './api';
import { listProducts } from '@/features/products/api';
import type { Product, RequisitionItem, RequisitionPriority } from '@/shared/types/domain';

interface LineItem extends RequisitionItem {
  productName: string;
  kfaCode: string;
}

const ORIGIN_OPTIONS = [
  { value: 'depo-rawat-inap', label: 'Depo Rawat Inap Lt. 3 (DRI)' },
  { value: 'depo-igd', label: 'Depo Gawat Darurat (DIGD)' },
  { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan (ARJ)' },
];

const PRIORITY_OPTIONS = [
  { value: 'RUTIN', label: 'ROUTINE — Permintaan Terjadwal / Rutin' },
  { value: 'URGENT', label: 'URGENT — Kebutuhan Mendesak Ruang Perawatan' },
  { value: 'EMERGENCY', label: 'EMERGENCY — Kondisi Cito / Gawat Darurat' },
];

const QUICK_RECOMMENDATIONS = [
  { id: '93000462', name: 'Paracetamol 500mg Tablet', code: 'KFA-93000462' },
  { id: '93012826', name: 'Amoxicillin 500mg Kapsul', code: 'KFA-93012826' },
  { id: '93000463', name: 'Ibuprofen 400mg Tablet', code: 'KFA-93000463' },
  { id: '93000464', name: 'Cefixime 100mg Kapsul', code: 'KFA-93000464' },
  { id: '93000466', name: 'Dexamethasone 0.5mg Tablet', code: 'KFA-93000466' },
];

export function RequisitionCreate() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();
  const { user } = useAuth();

  const [originId, setOriginId] = useState(activeLocationId || 'depo-rawat-inap');
  const [priority, setPriority] = useState<RequisitionPriority>('RUTIN');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load KFA product catalog for picker
  useEffect(() => {
    let cancelled = false;
    listProducts({ size: 30, keyword: search || undefined })
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

  const addItem = useCallback((product: { id: string; name: string; kfaCode?: string }) => {
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
        {
          productId: product.id,
          qtyRequested: 1,
          productName: product.name,
          kfaCode: product.kfaCode || product.id,
        },
      ];
    });
  }, []);

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, qtyRequested: Math.max(0, qty) } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (items.length === 0) {
      setValidationError('Minimal satu item obat wajib ditambahkan dalam formulir permintaan.');
      return;
    }

    const invalidQty = items.find((it) => it.qtyRequested <= 0);
    if (invalidQty) {
      setValidationError(`Jumlah permintaan untuk ${invalidQty.productName} harus lebih besar dari 0.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        originId,
        destinationId: 'wh-pusat',
        priority,
        items: items.map((it) => ({
          productId: it.productId,
          qtyRequested: it.qtyRequested,
        })),
      };
      const created = await createRequisition(payload);
      toast.success(
        `Permintaan ${created.requestNumber} berhasil dibuat dan dikirim ke Apoteker!`,
        'Sukses'
      );
      router.push(`/requisitions/${created.id}`);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Gagal membuat permintaan');
      toast.error('Gagal mengirim formulir permintaan obat.', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const totalUnits = items.reduce((acc, it) => acc + it.qtyRequested, 0);

  return (
    <div className="space-y-6">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link
            href="/requisitions"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d8e2dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2d6a4f] shadow-sm transition hover:bg-[#f1f5f3] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Daftar Permintaan
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#1b2a24]">
            Buat Permintaan Obat Unit Medis (New Requisition)
          </h1>
          <p className="text-xs text-[#52665d] mt-0.5">
            Ajukan kebutuhan obat dan perbekalan farmasi dari unit perawatan ke Gudang Farmasi Pusat.
          </p>
        </div>
      </div>

      {validationError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Unit & Urgency Information */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="border-b border-[#edf1ee] pb-3">
            <h2 className="text-sm font-bold text-[#2d6a4f]">1. Informasi Unit Pemohon & Urgensi Klinis</h2>
            <p className="text-[11px] text-[#6b7c74]">Tentukan unit ruangan pemohon serta tingkat prioritas layanan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="req-origin" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Unit / Depo Asal Pemohon <span className="text-rose-500">*</span>
              </label>
              <select
                id="req-origin"
                aria-label="Unit Asal"
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
              >
                {ORIGIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="req-dest" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Gudang Tujuan Pemenuhan
              </label>
              <input
                id="req-dest"
                type="text"
                disabled
                value="Gudang Farmasi Pusat (wh-pusat)"
                className="w-full rounded-xl border border-[#dfe6e2] bg-neutral-100 px-3 py-2 text-xs text-[#6b7c74]"
              />
            </div>

            <div>
              <label htmlFor="req-priority" className="block text-xs font-semibold text-[#52665d] mb-1.5">
                Prioritas / Tingkat Urgensi <span className="text-rose-500">*</span>
              </label>
              <select
                id="req-priority"
                aria-label="Prioritas"
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequisitionPriority)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none font-bold"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="req-notes" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Catatan Klinis / Indikasi Pengajuan (Opsional)
            </label>
            <input
              id="req-notes"
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Contoh: Tambahan kuota emergency pasien ruang isolasi, dll..."
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Catalog Selection & Quick Add */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="border-b border-[#edf1ee] pb-3">
            <h2 className="text-sm font-bold text-[#2d6a4f]">2. Pemilihan Obat dari Master Katalog KFA</h2>
            <p className="text-[11px] text-[#6b7c74]">Cari dan tambahkan obat yang ingin diminta ke dalam daftar rincian.</p>
          </div>

          {/* Quick Recommendations Chips */}
          <div>
            <span className="text-[11px] font-bold text-[#52665d] uppercase tracking-wider block mb-2">
              Rekomendasi Cepat Obat Sering Diminta:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_RECOMMENDATIONS.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => addItem({ id: rec.id, name: rec.name, kfaCode: rec.code })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#c8e6c9] bg-[#f1f8f4] px-3 py-1 text-xs font-semibold text-[#1b4332] transition hover:bg-[#e8f5e9]"
                >
                  <Plus className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  {rec.name}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Search & Dropdown Picker */}
          <div>
            <label htmlFor="product-search-input" className="block text-xs font-semibold text-[#52665d] mb-1.5">
              Cari Produk
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca8a2]" />
              <input
                id="product-search-input"
                aria-label="Cari Produk"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik nama obat (misal: Paracetamol, Amoxicillin, Cefixime)..."
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2.5 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] transition focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
              />
            </div>

            {catalog.length > 0 && search && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[#dfe6e2] bg-white divide-y divide-[#edf1ee] shadow-sm">
                {catalog.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f1f8f4] transition"
                  >
                    <div>
                      <div className="font-bold text-[#1b2a24]">{p.name}</div>
                      <div className="text-[10px] text-[#6b7c74] font-mono">Kode KFA: {p.kfaCode}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={() => addItem(p)}
                    >
                      Tambah Item
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Requisition Items Table */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf1ee] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#2d6a4f]">3. Daftar Rincian Permintaan Barang</h2>
              <p className="text-[11px] text-[#6b7c74]">Tentukan kuantitas obat yang dibutuhkan unit Anda.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-[#1b2a24]">{items.length} SKU</span>
              <span className="text-xs text-[#6b7c74]"> ({formatQuantity(totalUnits)} Unit)</span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#dfe6e2] p-8 text-center text-xs text-[#6b7c74]">
              <Package className="w-8 h-8 text-[#9ca8a2] mx-auto mb-2" />
              Belum ada obat yang ditambahkan. Gunakan pencarian katalog di atas atau tombol rekomendasi cepat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                    <th className="py-3 px-3 w-10 text-center">No.</th>
                    <th className="py-3 px-3 w-32">Kode KFA</th>
                    <th className="py-3 px-3">Nama Produk Obat</th>
                    <th className="py-3 px-3 text-right w-40">Jumlah Diminta <span className="text-rose-500">*</span></th>
                    <th className="py-3 px-3 text-center w-24">Satuan</th>
                    <th className="py-3 px-3 text-right w-16">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1ee]">
                  {items.map((it, idx) => (
                    <tr key={it.productId} className="transition hover:bg-[#f1f8f4]">
                      <td className="py-3 px-3 text-center font-mono text-[#6b7c74]">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#2d6a4f]">{it.kfaCode}</td>
                      <td className="py-3 px-3 font-semibold text-[#1b2a24]">{it.productName}</td>
                      <td className="py-3 px-3 text-right">
                        <input
                          id={`qty-${it.productId}`}
                          type="number"
                          min="1"
                          required
                          value={it.qtyRequested}
                          onChange={(e) => updateQty(it.productId, Number(e.target.value))}
                          className="w-24 rounded-lg border border-[#dfe6e2] bg-white px-2 py-1 text-right text-xs font-bold text-[#1b2a24] focus:border-[#2d6a4f] focus:outline-none"
                          aria-label="Jumlah"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-[#52665d]">Tablet/Botol</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(it.productId)}
                          className="text-[#9ca8a2] hover:text-rose-600 transition p-1"
                          aria-label={`Hapus ${it.productName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#edf1ee]">
            <p className="text-[11px] text-[#6b7c74]">
              Permintaan akan berstatus <span className="font-bold text-[#1b2a24]">SUBMITTED</span> dan langsung diteruskan ke Apoteker Gudang untuk diotorisasi.
            </p>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/requisitions')}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Kirim Permintaan ke Apoteker
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
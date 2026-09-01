'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Coins,
  Database,
  Layers,
  Package,
  Pill,
  Save,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Thermometer,
} from 'lucide-react';
import { z } from 'zod';
import { Button, Card, Input, Select, Skeleton, useToast } from '@/shared/ui';
import type { Product } from '@/shared/types/domain';
import { createProduct, updateProduct, getProduct, getCategories } from '../api';

export interface ProductFormProps {
  product?: Product;
  productId?: string;
  mode?: 'create' | 'edit';
}

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  kfaCode: z.string().min(1, 'KFA Code wajib diisi'),
  zatAktif: z.string().min(1, 'Zat aktif wajib diisi'),
  kekuatan: z.string().optional(),
  dosageForm: z.string().optional(),
  nie: z.string().optional(),
  manufacturer: z.string().optional(),
  price: z
    .string()
    .optional()
    .refine((v) => v === undefined || v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
      message: 'Harga harus berupa angka non-negatif',
    }),
  uom: z.string().optional(),
  category: z.string().optional(),
  storageCondition: z.string().optional(),
  isHighAlert: z.boolean().optional(),
  isColdChain: z.boolean().optional(),
});

type Schema = z.infer<typeof productSchema>;

interface FormState {
  name: string;
  kfaCode: string;
  zatAktif: string;
  kekuatan: string;
  dosageForm: string;
  nie: string;
  manufacturer: string;
  price: string;
  uom: string;
  category: string;
  storageCondition: string;
  isHighAlert: boolean;
  isColdChain: boolean;
}

const emptyState: FormState = {
  name: '',
  kfaCode: '',
  zatAktif: '',
  kekuatan: '',
  dosageForm: '',
  nie: '',
  manufacturer: '',
  price: '',
  uom: 'Tablet',
  category: '',
  storageCondition: 'ROOM_TEMP',
  isHighAlert: false,
  isColdChain: false,
};

function toState(product?: Product): FormState {
  if (!product) return emptyState;
  const isCold =
    product.name.toLowerCase().includes('injeksi') ||
    product.name.toLowerCase().includes('insulin') ||
    product.name.toLowerCase().includes('vaksin');
  const isHigh =
    product.name.toLowerCase().includes('injeksi') ||
    product.name.toLowerCase().includes('morfin') ||
    product.name.toLowerCase().includes('heparin');

  return {
    name: product.name ?? '',
    kfaCode: product.kfaCode ?? '',
    zatAktif: product.zatAktif ?? '',
    kekuatan: product.kekuatan ?? '',
    dosageForm: product.dosageForm ?? '',
    nie: product.nie ?? '',
    manufacturer: product.manufacturer ?? '',
    price: product.price != null ? String(product.price) : '',
    uom: product.uom ?? 'Tablet',
    category: product.category ?? '',
    storageCondition: isCold ? 'COLD_CHAIN' : 'ROOM_TEMP',
    isHighAlert: isHigh,
    isColdChain: isCold,
  };
}

function toPayload(state: FormState): Partial<Product> {
  return {
    name: state.name,
    kfaCode: state.kfaCode,
    zatAktif: state.zatAktif,
    kekuatan: state.kekuatan,
    dosageForm: state.dosageForm,
    nie: state.nie,
    manufacturer: state.manufacturer,
    price: state.price === '' ? 0 : Number(state.price),
    uom: state.uom,
    category: state.category,
  };
}

type ValidationResult =
  | { success: true; data: FormState }
  | { success: false; errors: Partial<Record<keyof FormState, string>> };

function validate(state: FormState): ValidationResult {
  const parsed = productSchema.safeParse(state);
  if (parsed.success) return { success: true, data: state as FormState };
  const errors: Partial<Record<keyof FormState, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof FormState;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { success: false, errors };
}

export function ProductForm({ product, productId, mode }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const isEdit = mode === 'edit' || Boolean(productId) || Boolean(product?.id);
  const [form, setForm] = useState<FormState>(() => toState(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(productId && !product));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (product) {
      setForm(toState(product));
      return;
    }
    if (!productId) return;

    let cancelled = false;
    setLoading(true);
    getProduct(productId)
      .then((p) => {
        if (!cancelled) {
          setForm(toState(p));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Gagal memuat produk', 'Error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, product, toast]);

  const handleChange = (field: keyof FormState, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(form);
    if (!result.success) {
      setErrors(result.errors);
      toast.error('Periksa kembali input form yang ditandai merah', 'Validasi Gagal');
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload(result.data);
      const targetId = productId || product?.id || form.kfaCode;

      if (isEdit && targetId) {
        await updateProduct(targetId, payload);
        toast.success(`Master produk ${form.name} berhasil diperbarui`, 'Perubahan Tersimpan');
        router.push(`/products/${targetId}`);
      } else {
        const created = await createProduct(payload as Product);
        toast.success(`Produk baru ${form.name} berhasil didaftarkan`, 'Pendaftaran Berhasil');
        router.push(`/products/${created.id || form.kfaCode}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan produk', 'Kesalahan Sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── 1. Breadcrumb + Back ── */}
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Batal & Kembali ke Katalog
        </Link>
        <span className="text-xs text-[#9ca8a2]">/</span>
        <span className="text-xs font-semibold text-[#52665d]">
          {isEdit ? `Edit Produk: ${form.name || form.kfaCode}` : 'Tambah Produk Baru'}
        </span>
      </div>

      {/* ── 2. Header Title Banner ── */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#d8f3dc] p-3 text-[#2d6a4f]">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1b2a24]">
              {isEdit ? 'Perbarui Master Data Obat' : 'Formulir Pendaftaran Obat Baru (KFA)'}
            </h1>
            <p className="text-xs text-[#52665d] mt-0.5">
              Integrasi master katalog farmasi terstandarisasi Kamus Farmasi dan Alat Kesehatan (KFA) Kemenkes RI.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. Structured 3-Section Form ── */}
      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas & Nomenklatur */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <Database className="w-4 h-4 text-[#2d6a4f]" />
            Bagian 1: Identitas & Nomenklatur KFA
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                id="product-kfa-code"
                label="KFA Code (Kode KFA)"
                required
                value={form.kfaCode}
                onChange={(e) => handleChange('kfaCode', e.target.value)}
                error={errors.kfaCode}
                placeholder="Contoh: 93000462 (8-digit angka)"
                disabled={isEdit}
              />
            </div>

            <div>
              <Input
                id="product-name"
                label="Nama Produk Obat (Nama Resmi)"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                placeholder="Contoh: Paracetamol 500 mg Tablet"
              />
            </div>

            <div>
              <Input
                id="product-zat-aktif"
                label="Zat Aktif / Generik"
                required
                value={form.zatAktif}
                onChange={(e) => handleChange('zatAktif', e.target.value)}
                error={errors.zatAktif}
                placeholder="Contoh: Paracetamol, Amoxicillin"
              />
            </div>

            <div>
              <Input
                id="product-nie"
                label="Nomor Izin Edar (NIE BPOM)"
                value={form.nie}
                onChange={(e) => handleChange('nie', e.target.value)}
                error={errors.nie}
                placeholder="Contoh: DKL1234567890A1"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                id="product-manufacturer"
                label="Produsen / Pabrik Farmasi (Manufacturer)"
                value={form.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                error={errors.manufacturer}
                placeholder="Contoh: Kimia Farma, Kalbe Farma, Sanbe"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Karakteristik Farmasi & Kemasan */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <Layers className="w-4 h-4 text-[#2d6a4f]" />
            Bagian 2: Karakteristik Farmasi & Kemasan
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                id="product-category"
                label="Kategori Terapeutik (Category)"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                error={errors.category}
                options={[
                  { value: '', label: 'Pilih Kategori...' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>

            <div>
              <Input
                id="product-dosage-form"
                label="Bentuk Sediaan (Dosage Form)"
                value={form.dosageForm}
                onChange={(e) => handleChange('dosageForm', e.target.value)}
                error={errors.dosageForm}
                placeholder="Contoh: Tablet, Kapsul, Injeksi"
              />
            </div>

            <div>
              <Input
                id="product-kekuatan"
                label="Kekuatan Dosis (Strength)"
                value={form.kekuatan}
                onChange={(e) => handleChange('kekuatan', e.target.value)}
                error={errors.kekuatan}
                placeholder="Contoh: 500 mg, 20 mg/mL"
              />
            </div>

            <div>
              <Input
                id="product-uom"
                label="Satuan Terkecil (Base UOM)"
                value={form.uom}
                onChange={(e) => handleChange('uom', e.target.value)}
                error={errors.uom}
                placeholder="Contoh: Tablet, Botol, Vial"
              />
            </div>

            <div className="md:col-span-2">
              <Input
                id="product-price"
                label="Harga Acuan HET Kemenkes (Rp)"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                error={errors.price}
                placeholder="Contoh: 5000 (angka tanpa titik)"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Penanganan Khusus & Keamanan Klinis */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24] border-b border-[#edf1ee] pb-3">
            <ShieldAlert className="w-4 h-4 text-[#2d6a4f]" />
            Bagian 3: Penanganan Khusus & Keamanan Klinis
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#edf1ee] bg-[#f8faf9] flex items-start gap-3">
              <input
                id="flag-cold-chain"
                type="checkbox"
                checked={form.isColdChain}
                onChange={(e) => handleChange('isColdChain', e.target.checked)}
                className="mt-0.5 rounded border-[#dfe6e2] text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <label htmlFor="flag-cold-chain" className="text-xs cursor-pointer">
                <span className="font-bold text-[#1b2a24] block flex items-center gap-1">
                  <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                  Cold Chain (2–8°C)
                </span>
                <span className="text-[11px] text-[#6b7c74]">Memerlukan penyimpanan kulkas farmasi khusus.</span>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-[#edf1ee] bg-[#f8faf9] flex items-start gap-3">
              <input
                id="flag-high-alert"
                type="checkbox"
                checked={form.isHighAlert}
                onChange={(e) => handleChange('isHighAlert', e.target.checked)}
                className="mt-0.5 rounded border-[#dfe6e2] text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <label htmlFor="flag-high-alert" className="text-xs cursor-pointer">
                <span className="font-bold text-[#1b2a24] block flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  High Alert Medicine
                </span>
                <span className="text-[11px] text-[#6b7c74]">Obat dengan kewaspadaan tinggi (elektrolit pekat, sitostatika).</span>
              </label>
            </div>

            <div className="p-4 rounded-xl border border-[#edf1ee] bg-[#f8faf9] flex items-start gap-3">
              <input
                id="flag-lasa"
                type="checkbox"
                defaultChecked={false}
                className="mt-0.5 rounded border-[#dfe6e2] text-[#2d6a4f] focus:ring-[#2d6a4f]"
              />
              <label htmlFor="flag-lasa" className="text-xs cursor-pointer">
                <span className="font-bold text-[#1b2a24] block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Peringatan LASA
                </span>
                <span className="text-[11px] text-[#6b7c74]">Look-Alike Sound-Alike nama/kemasan mirip.</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Submit Action Footer ── */}
        <div className="flex items-center justify-between rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
          >
            Batal
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            leftIcon={<Save className="w-4 h-4" />}
            className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-xs font-semibold text-white px-6 shadow-sm"
          >
            {isEdit ? 'Simpan Perubahan Master Produk' : 'Simpan & Daftarkan Produk'}
          </Button>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Card, Input, Select, Button, Skeleton } from '@/shared/ui';
import { useToast } from '@/shared/ui';
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
  uom: '',
  category: '',
};

function toState(product?: Product): FormState {
  if (!product) return emptyState;
  return {
    name: product.name ?? '',
    kfaCode: product.kfaCode ?? '',
    zatAktif: product.zatAktif ?? '',
    kekuatan: product.kekuatan ?? '',
    dosageForm: product.dosageForm ?? '',
    nie: product.nie ?? '',
    manufacturer: product.manufacturer ?? '',
    price: product.price != null ? String(product.price) : '',
    uom: product.uom ?? '',
    category: product.category ?? '',
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

type ValidationResult = { success: true; data: FormState } | { success: false; errors: Partial<Record<keyof FormState, string>> };

function validate(state: FormState): ValidationResult {
  const parsed = productSchema.safeParse(state);
  if (parsed.success) return { success: true, data: state as FormState };
  const errors: Partial<Record<keyof FormState, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof FormState;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

export function ProductForm({ product, productId, mode = 'create' }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = useState<FormState>(() => toState(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(mode === 'edit' && productId && !product));

  const [categories, setCategories] = useState<string[]>([]);

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
    if (mode !== 'edit' || !productId || product) return;
    let cancelled = false;
    setLoadingInitial(true);
    getProduct(productId)
      .then((p) => {
        if (!cancelled) setValues(toState(p));
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Gagal memuat data produk', 'Gagal');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, productId, product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload(result.data);
      if (mode === 'edit' && product?.id) {
        await updateProduct(product.id, payload);
        toast.success('Produk berhasil diperbarui', 'Berhasil');
      } else {
        await createProduct(payload);
        toast.success('Produk berhasil dibuat', 'Berhasil');
      }
      router.push('/products');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan produk', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <Card title={mode === 'edit' ? 'Edit Product' : 'New Product'} padding="lg">
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" height={28} width="40%" count={1} />
          <Skeleton variant="text" height={16} count={6} />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={mode === 'edit' ? 'Edit Product' : 'New Product'}
      subtitle={mode === 'edit' ? `KFA: ${product?.kfaCode ?? ''}` : 'Register a new product'}
      padding="lg"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.back()}
            disabled={submitting}
          >
            Back
          </Button>
          <Button type="submit" form="product-form" isLoading={submitting} leftIcon={<Save className="w-4 h-4" />}>
            Simpan Produk
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              id="name"
              label="Nama Produk"
              placeholder="Paracetamol 500 mg"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
              required
            />
          </div>

          <Input
            id="kfaCode"
            label="KFA Code"
            placeholder="93000462"
            value={values.kfaCode}
            onChange={(e) => set('kfaCode', e.target.value)}
            error={errors.kfaCode}
            isMono
            required
          />
          <Input
            id="nie"
            label="NIE"
            placeholder="GBL2101710510A1"
            value={values.nie}
            onChange={(e) => set('nie', e.target.value)}
            error={errors.nie}
            isMono
          />

          <Input
            id="zatAktif"
            label="Zat Aktif"
            placeholder="Paracetamol"
            value={values.zatAktif}
            onChange={(e) => set('zatAktif', e.target.value)}
            error={errors.zatAktif}
            required
          />
          <Input
            id="kekuatan"
            label="Kekuatan"
            placeholder="500 mg"
            value={values.kekuatan}
            onChange={(e) => set('kekuatan', e.target.value)}
            error={errors.kekuatan}
          />

          <Input
            id="dosageForm"
            label="Dosage Form"
            placeholder="Tablet"
            value={values.dosageForm}
            onChange={(e) => set('dosageForm', e.target.value)}
            error={errors.dosageForm}
          />
          <Input
            id="manufacturer"
            label="Produsen"
            placeholder="AFIFARMA"
            value={values.manufacturer}
            onChange={(e) => set('manufacturer', e.target.value)}
            error={errors.manufacturer}
          />

          <Input
            id="price"
            label="Harga (IDR)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="5000"
            value={values.price}
            onChange={(e) => set('price', e.target.value)}
            error={errors.price}
          />
          <Input
            id="uom"
            label="Satuan (UoM)"
            placeholder="Tablet"
            value={values.uom}
            onChange={(e) => set('uom', e.target.value)}
            error={errors.uom}
          />

          <div className="md:col-span-2">
            <Select
              id="category"
              label="Kategori"
              value={values.category}
              onChange={(e) => set('category', e.target.value)}
              error={errors.category}
              options={[
                { value: '', label: 'Pilih Kategori…' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              placeholder="Pilih Kategori…"
            />
          </div>
        </div>
      </form>
    </Card>
  );
}

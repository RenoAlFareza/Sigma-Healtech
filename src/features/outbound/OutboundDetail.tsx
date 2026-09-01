'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  Download,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  Truck,
  User,
  Warehouse,
} from 'lucide-react';
import { Button, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import { formatDate, formatNumber } from '@/shared/lib/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { getOutbound, transitionOutboundStatus } from './api';
import type { MovementStatus, StockMovement } from '@/shared/types/domain';

// ─── Extended movement item with FEFO details ────────────────────────────────
interface FefoMovementItem {
  productId: string;
  productName: string;
  sku: string;
  lot: string;
  expiry: string;
  bin: string;
  qtyRequested: number;
  qtyPicked: number;
  unit: string;
  isHighAlert?: boolean;
  isNarcotics?: boolean;
}

// ─── Dummy data helpers ───────────────────────────────────────────────────────
const DUMMY_ITEMS: FefoMovementItem[] = [
  {
    productId: 'PRD-001',
    productName: 'Amoxicillin 500 mg Kapsul',
    sku: 'AMX-500K',
    lot: 'AMX-2025-A41',
    expiry: '2026-11-30',
    bin: 'R-A01-S02',
    qtyRequested: 120,
    qtyPicked: 120,
    unit: 'Kapsul',
    isHighAlert: false,
  },
  {
    productId: 'PRD-002',
    productName: 'Omeprazol 20 mg Kapsul',
    sku: 'OMP-020K',
    lot: 'OMP-2025-B12',
    expiry: '2026-08-15',
    bin: 'R-B03-S01',
    qtyRequested: 60,
    qtyPicked: 60,
    unit: 'Kapsul',
    isHighAlert: false,
  },
  {
    productId: 'PRD-003',
    productName: 'Infus NaCl 0,9% 500 mL',
    sku: 'NACL-500',
    lot: 'NACL-2026-C07',
    expiry: '2027-03-31',
    bin: 'R-C01-S03',
    qtyRequested: 24,
    qtyPicked: 20,
    unit: 'Botol',
    isHighAlert: false,
  },
  {
    productId: 'PRD-004',
    productName: 'Morfin HCl 10 mg/mL Injeksi',
    sku: 'MRF-010I',
    lot: 'MRF-2026-N03',
    expiry: '2026-12-31',
    bin: 'NARK-S01-K1',
    qtyRequested: 10,
    qtyPicked: 10,
    unit: 'Ampul',
    isHighAlert: true,
    isNarcotics: true,
  },
  {
    productId: 'PRD-005',
    productName: 'Heparin 5000 IU/mL Injeksi',
    sku: 'HEP-5000I',
    lot: 'HEP-2026-H09',
    expiry: '2026-10-01',
    bin: 'R-D02-S04',
    qtyRequested: 15,
    qtyPicked: 15,
    unit: 'Vial',
    isHighAlert: true,
    isNarcotics: false,
  },
];

// Workflow steps for outbound FEFO
const STEPS: { key: MovementStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'DRAFT', label: 'Draf', icon: <Package className="w-4 h-4" /> },
  { key: 'ITEMS', label: 'Item Dipilih', icon: <Boxes className="w-4 h-4" /> },
  { key: 'PICKING', label: 'Picking FEFO', icon: <Warehouse className="w-4 h-4" /> },
  { key: 'PACKED', label: 'Dikemas', icon: <PackageCheck className="w-4 h-4" /> },
  { key: 'DISPATCHED', label: 'Dikirim', icon: <Truck className="w-4 h-4" /> },
  { key: 'RECEIVED', label: 'Diterima', icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STEP_ORDER: MovementStatus[] = ['DRAFT', 'ITEMS', 'PICKING', 'PACKED', 'DISPATCHED', 'RECEIVED'];

function getStepIndex(status: MovementStatus): number {
  return STEP_ORDER.indexOf(status);
}

// ─── Rich dummy movement factory ─────────────────────────────────────────────
function buildDummyMovement(id: string): StockMovement & {
  requestedBy: string;
  pickedBy: string;
  packedBy: string;
  dispatchedBy: string;
  requisitionRef: string;
  notes: string;
  items: FefoMovementItem[];
} {
  return {
    id,
    movementNumber: `OB-2026-${id.slice(-4).toUpperCase()}`,
    originId: 'Gudang Farmasi Pusat (GFP)',
    destinationId: 'Depo Rawat Inap Lt. 3 (DRI-3)',
    type: 'REQUISITION_FULFILLMENT',
    status: 'PICKING',
    items: DUMMY_ITEMS as never,
    createdAt: '2026-09-01T08:30:00+07:00',
    requestedBy: 'Ns. Budi Santoso, S.Kep (Kepala Ruangan RI-3)',
    pickedBy: 'Apt. Siti Rahayu, S.Farm (Petugas Gudang)',
    packedBy: '',
    dispatchedBy: '',
    requisitionRef: 'REQ-2026-0891',
    notes:
      'Permintaan rutin harian Ruang Rawat Inap Lt. 3 — Bangsal Jantung. Prioritas: Morfin dan Heparin untuk pasien ACS.',
  };
}

// ─── Expiry badge helper ──────────────────────────────────────────────────────
function ExpiryBadge({ expiry }: { expiry: string }) {
  const daysLeft = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (daysLeft <= 30)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
        <AlertTriangle className="w-2.5 h-2.5" />
        {expiry} ({daysLeft}h)
      </span>
    );
  if (daysLeft <= 90)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
        <Clock className="w-2.5 h-2.5" />
        {expiry} ({daysLeft}h)
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
      {expiry}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OutboundDetail({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { role } = useAuth();

  const canProcess = role !== null && ['ASSISTANT', 'PHARMACIST', 'MANAGER', 'ADMIN'].includes(role);

  const [rawData, setRawData] = useState<ReturnType<typeof buildDummyMovement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOutbound(id);
      // Merge real status with dummy detail data
      const dummy = buildDummyMovement(id);
      setRawData({ ...dummy, status: res.status, movementNumber: res.movementNumber || dummy.movementNumber });
    } catch {
      // Fallback to dummy when API is unavailable (mock env)
      setRawData(buildDummyMovement(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTransition = useCallback(
    async (nextStatus: MovementStatus) => {
      if (!rawData) return;
      setWorking(true);
      try {
        await transitionOutboundStatus(id, nextStatus);
        setRawData((prev) => (prev ? { ...prev, status: nextStatus } : prev));
        toast.success(`Outbound ${rawData.movementNumber} → ${nextStatus}`, 'Status diperbarui');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan', 'Gagal');
      } finally {
        setWorking(false);
      }
    },
    [id, rawData, toast]
  );

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] p-6 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error || !rawData) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] p-6 flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-[#9ca8a2]" />
        <p className="text-sm text-[#52665d]">{error ?? 'Data outbound tidak ditemukan'}</p>
        <Button variant="outline" size="sm" onClick={fetchData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  const data = rawData;
  const currentIdx = getStepIndex(data.status);
  const items = data.items as unknown as FefoMovementItem[];

  const totalQtyRequested = items.reduce((a, i) => a + i.qtyRequested, 0);
  const totalQtyPicked = items.reduce((a, i) => a + i.qtyPicked, 0);
  const hasHighAlert = items.some((i) => i.isHighAlert);
  const hasNarcotics = items.some((i) => i.isNarcotics);

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      {/* ── Page Wrapper ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── 1. Breadcrumb + Back ── */}
        <div className="flex items-center gap-3">
          <Link
            href="/outbound"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar Outbound
          </Link>
          <span className="text-xs text-[#9ca8a2]">/</span>
          <span className="text-xs font-mono font-bold text-[#2d6a4f]">{data.movementNumber}</span>
        </div>

        {/* ── 2. Master Document Card ── */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_12px_rgba(27,42,36,0.06)] overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#edf1ee] bg-gradient-to-r from-[#f8faf9] to-white">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d8f3dc] p-2.5">
                <Truck className="w-5 h-5 text-[#2d6a4f]" />
              </div>
              <div>
                <h1 className="text-base font-black text-[#1b2a24]">{data.movementNumber}</h1>
                <p className="text-xs text-[#52665d]">Surat Pengeluaran Gudang — Fulfillment Permintaan Unit Medis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasHighAlert && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                  <ShieldAlert className="w-3 h-3" />
                  HIGH ALERT
                </span>
              )}
              {hasNarcotics && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 ring-1 ring-red-200 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  NARKOTIKA
                </span>
              )}
              <StatusBadge status={data.status} size="sm" />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-[#edf1ee]">
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <Building2 className="w-3 h-3" /> Gudang Asal
              </div>
              <p className="text-xs font-bold text-[#1b2a24]">{data.originId}</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <MapPin className="w-3 h-3" /> Unit Tujuan
              </div>
              <p className="text-xs font-bold text-[#2d6a4f]">{data.destinationId}</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <Calendar className="w-3 h-3" /> Tanggal Dibuat
              </div>
              <p className="text-xs font-bold text-[#1b2a24]">{formatDate(data.createdAt, 'long')}</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <User className="w-3 h-3" /> Pemohon
              </div>
              <p className="text-xs font-bold text-[#1b2a24] leading-tight">{data.requestedBy}</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <Boxes className="w-3 h-3" /> Referensi Requisisi
              </div>
              <Link
                href={`/requisitions/${data.requisitionRef}`}
                className="text-xs font-mono font-bold text-[#2d6a4f] hover:underline"
              >
                {data.requisitionRef}
              </Link>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <Package className="w-3 h-3" /> Total SKU
              </div>
              <p className="text-xs font-bold text-[#1b2a24]">{items.length} Jenis Obat</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" /> Total Qty Diminta
              </div>
              <p className="text-xs font-bold text-[#1b2a24]">{formatNumber(totalQtyRequested)} Unit</p>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#52665d] uppercase tracking-wider">
                <PackageCheck className="w-3 h-3" /> Total Qty Dipick
              </div>
              <p className={`text-xs font-bold ${totalQtyPicked < totalQtyRequested ? 'text-amber-700' : 'text-[#2d6a4f]'}`}>
                {formatNumber(totalQtyPicked)} Unit
                {totalQtyPicked < totalQtyRequested && (
                  <span className="ml-1 text-amber-600">(Parsial)</span>
                )}
              </p>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="px-6 py-3 bg-[#fffdf0] border-t border-[#e5eae7]">
              <p className="text-[11px] text-[#52665d]">
                <span className="font-bold">Catatan Klinis: </span>
                {data.notes}
              </p>
            </div>
          )}
        </div>

        {/* ── 3. Workflow Stepper ── */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <h2 className="text-xs font-bold text-[#52665d] mb-4">Progres Alur Pengeluaran Gudang</h2>
          <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isUpcoming = idx > currentIdx;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                    <div
                      className={`
                        flex items-center justify-center w-9 h-9 rounded-full border-2 transition
                        ${isCompleted ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white' : ''}
                        ${isCurrent ? 'bg-white border-[#2d6a4f] text-[#2d6a4f] ring-4 ring-[#d8f3dc]' : ''}
                        ${isUpcoming ? 'bg-white border-[#dfe6e2] text-[#9ca8a2]' : ''}
                      `}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                    </div>
                    <span
                      className={`text-[10px] font-semibold text-center leading-tight ${
                        isCurrent ? 'text-[#2d6a4f]' : isCompleted ? 'text-[#52665d]' : 'text-[#9ca8a2]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded-full transition ${
                        idx < currentIdx ? 'bg-[#2d6a4f]' : 'bg-[#dfe6e2]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── 4. KPI Bento Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#52665d]">SKU Terpenuhi</span>
              <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#1b2a24]">
              {items.filter((i) => i.qtyPicked >= i.qtyRequested).length}
              <span className="text-sm font-semibold text-[#52665d]">/{items.length}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7c74]">Item terpenuhi penuh sesuai permintaan</p>
          </div>

          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#52665d]">Qty Pick / Minta</span>
              <Warehouse className="h-4 w-4 text-[#2d6a4f]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#1b2a24]">
              {formatNumber(totalQtyPicked)}
              <span className="text-sm font-semibold text-[#52665d]">/{formatNumber(totalQtyRequested)}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7c74]">Unit obat berhasil dipick FEFO</p>
          </div>

          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#52665d]">Fill Rate</span>
              <PackageCheck className="h-4 w-4 text-[#2d6a4f]" />
            </div>
            <div className={`mt-2 text-2xl font-black ${totalQtyPicked / totalQtyRequested >= 1 ? 'text-[#2d6a4f]' : 'text-amber-600'}`}>
              {totalQtyRequested > 0
                ? Math.round((totalQtyPicked / totalQtyRequested) * 100)
                : 0}%
            </div>
            <p className="mt-1 text-[11px] text-[#6b7c74]">Rasio terpenuhi vs permintaan unit</p>
          </div>
        </div>

        {/* ── 5. FEFO Item Table ── */}
        <div className="rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf1ee]">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#2d6a4f]" />
              <h2 className="text-sm font-bold text-[#1b2a24]">Daftar Item Obat — Alokasi FEFO</h2>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe6e2] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Pick Slip
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Nama Obat / SKU</th>
                  <th className="py-3 px-4">No. Lot / Batch</th>
                  <th className="py-3 px-4">Tgl. Expired (FEFO)</th>
                  <th className="py-3 px-4">Lokasi Bin Rak</th>
                  <th className="py-3 px-4 text-right">Qty Diminta</th>
                  <th className="py-3 px-4 text-right">Qty Dipick</th>
                  <th className="py-3 px-4 text-center">Satuan</th>
                  <th className="py-3 px-4 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {items.map((item, idx) => {
                  const isPartial = item.qtyPicked < item.qtyRequested;
                  return (
                    <tr key={item.productId} className="hover:bg-[#f8faf9] transition">
                      <td className="py-3 px-4 text-[#9ca8a2] font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1b2a24]">{item.productName}</div>
                        <div className="text-[10px] font-mono text-[#9ca8a2]">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#52665d] font-semibold">{item.lot}</td>
                      <td className="py-3 px-4">
                        <ExpiryBadge expiry={item.expiry} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#f1f8f4] px-2 py-0.5 text-[11px] font-mono font-bold text-[#2d6a4f]">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.bin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#1b2a24]">
                        {formatNumber(item.qtyRequested)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${isPartial ? 'text-amber-700' : 'text-[#2d6a4f]'}`}>
                        {formatNumber(item.qtyPicked)}
                      </td>
                      <td className="py-3 px-4 text-center text-[#52665d]">{item.unit}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {item.isNarcotics && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700 ring-1 ring-red-200 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              NARK
                            </span>
                          )}
                          {item.isHighAlert && !item.isNarcotics && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              HIGH ALERT
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              ⚠ PARSIAL
                            </span>
                          )}
                          {!item.isHighAlert && !item.isNarcotics && !isPartial && (
                            <span className="text-[10px] text-[#9ca8a2]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8faf9] border-t-2 border-[#e5eae7] text-xs font-bold text-[#1b2a24]">
                  <td colSpan={5} className="py-3 px-4 text-right text-[#52665d]">TOTAL</td>
                  <td className="py-3 px-4 text-right">{formatNumber(totalQtyRequested)}</td>
                  <td className={`py-3 px-4 text-right ${totalQtyPicked < totalQtyRequested ? 'text-amber-700' : 'text-[#2d6a4f]'}`}>
                    {formatNumber(totalQtyPicked)}
                  </td>
                  <td colSpan={2} className="py-3 px-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── 6. Action Footer ── */}
        {canProcess && (
          <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
            <h2 className="text-xs font-bold text-[#52665d] mb-3">Aksi Proses Pengeluaran</h2>
            <div className="flex flex-wrap items-center gap-3">

              {/* DRAFT → ITEMS */}
              {data.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={working}
                  leftIcon={<Boxes className="w-4 h-4" />}
                  onClick={() => handleTransition('ITEMS')}
                >
                  Konfirmasi Item Obat
                </Button>
              )}

              {/* ITEMS → PICKING */}
              {data.status === 'ITEMS' && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={working}
                  leftIcon={<Warehouse className="w-4 h-4" />}
                  onClick={() => handleTransition('PICKING')}
                >
                  Mulai Picking FEFO
                </Button>
              )}

              {/* PICKING → Cetak Pick Slip + lanjut ke PACKED */}
              {data.status === 'PICKING' && (
                <>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Pick Slip
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={working}
                    leftIcon={<PackageCheck className="w-4 h-4" />}
                    onClick={() => handleTransition('PACKED')}
                  >
                    Selesai Pick — Kemas & Segel
                  </Button>
                </>
              )}

              {/* PACKED → DISPATCHED */}
              {data.status === 'PACKED' && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={working}
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={() => handleTransition('DISPATCHED')}
                >
                  Konfirmasi Dispatch — Kirim Barang
                </Button>
              )}

              {/* DISPATCHED → Lihat Surat Jalan */}
              {data.status === 'DISPATCHED' && (
                <>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e2] bg-white px-4 py-2 text-xs font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Surat Jalan (PDF)
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={working}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => handleTransition('RECEIVED')}
                  >
                    Konfirmasi Diterima Unit
                  </Button>
                </>
              )}

              {/* RECEIVED — final state */}
              {data.status === 'RECEIVED' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2d6a4f]">
                  <CheckCircle2 className="w-4 h-4" />
                  Pengeluaran telah selesai dan diterima unit.
                </div>
              )}

              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={working}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={fetchData}
                >
                  Segarkan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

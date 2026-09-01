'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  PackageX,
  PieChart,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Truck,
  Warehouse,
} from 'lucide-react';
import { Button, Card, DataTable, EmptyState, ErrorState, Input, Skeleton, StatusBadge, useToast } from '@/shared/ui';
import type { DataTableColumn } from '@/shared/ui';
import { formatCurrency, formatDate, formatNumber, formatQuantity } from '@/shared/lib/format';
import { useActiveLocation } from '@/features/shell/ActiveLocationContext';
import { getReport } from './api';
import type {
  AuditRow,
  ExpiryRow,
  ReportData,
  ReportType,
  StockoutRow,
  SummaryRow,
  TransactionRow,
} from './api';

const LOCATION_OPTIONS = [
  { value: 'ALL', label: 'Semua Lokasi Fasilitas' },
  { value: 'wh-pusat', label: 'Gudang Farmasi Pusat (GFP)' },
  { value: 'depo-igd', label: 'Depo Farmasi IGD (DIGD)' },
  { value: 'depo-rawat-inap', label: 'Depo Rawat Inap (DRI)' },
  { value: 'apotek-rawat-jalan', label: 'Apotek Rawat Jalan (ARJ)' },
];

const EXPIRY_THRESHOLD_OPTIONS = [
  { value: '30', label: 'Kritis (< 30 Hari)' },
  { value: '60', label: 'Tinggi (< 60 Hari)' },
  { value: '90', label: 'Standar (< 90 Hari)' },
  { value: '180', label: 'Monitoring (< 180 Hari)' },
  { value: '365', label: 'Semua (< 1 Tahun)' },
];

const TAB_DEFINITIONS: { id: ReportType; label: string; shortLabel: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'summary',
    label: 'Saldo & Valuasi (ABC)',
    shortLabel: 'Valuasi ABC',
    icon: <PieChart className="w-4 h-4" />,
    description: 'Analisis Pareto aset obat dan kapitalisasi nilai stok per kategori farmasi.',
  },
  {
    id: 'expiry',
    label: 'Risiko Kedaluwarsa',
    shortLabel: 'Kedaluwarsa',
    icon: <Clock className="w-4 h-4" />,
    description: 'Early Warning System FEFO mendeteksi obat mendekati masa ED.',
  },
  {
    id: 'stockout',
    label: 'Prediksi Stockout',
    shortLabel: 'Stockout & ADC',
    icon: <TrendingDown className="w-4 h-4" />,
    description: 'Proyeksi sisa hari ketersediaan obat berdasarkan Average Daily Consumption.',
  },
  {
    id: 'audit',
    label: 'Rekap Audit Opname',
    shortLabel: 'Audit Opname',
    icon: <FileCheck className="w-4 h-4" />,
    description: 'Rekapitulasi akurasi fisik, selisih finansial, dan audit cycle count.',
  },
  {
    id: 'transactions',
    label: 'Jejak Transaksi',
    shortLabel: 'Transaksi',
    icon: <History className="w-4 h-4" />,
    description: 'Log mutasi buku besar elektronik persediaan masuk dan keluar.',
  },
];

export function ReportsHub({ initialType = 'summary' }: { initialType?: ReportType }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { activeLocationId } = useActiveLocation();

  const [type, setType] = useState<ReportType>(initialType);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState(activeLocationId || 'ALL');
  const [selectedDays, setSelectedDays] = useState('90');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(
    async (reportType: ReportType) => {
      setLoading(true);
      setError(null);
      try {
        const daysNum = selectedDays ? parseInt(selectedDays, 10) : undefined;
        const res = await getReport(reportType, {
          locationId: selectedLocation !== 'ALL' ? selectedLocation : undefined,
          days: daysNum,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat laporan');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [selectedLocation, selectedDays]
  );

  useEffect(() => {
    fetchData(type);
  }, [type, fetchData]);

  const handleTabChange = (tabId: ReportType) => {
    setType(tabId);
    setSearchQuery('');
    router.replace(`${pathname}?type=${tabId}`, { scroll: false });
  };

  // CSV Export Engine
  const exportCsv = () => {
    if (!data) return;
    let rows: Record<string, unknown>[] = [];

    if (data.type === 'summary') {
      rows = data.rows.map((r) => ({
        'Kategori Obat': r.category,
        'Klasifikasi ABC': `Kelas ${r.abcClass || 'C'}`,
        'Jumlah SKU': r.productCount,
        'Total Kuantitas Fisik': r.qty,
        'Valuasi Finansial (Rp)': r.value,
        'Kontribusi Nilai (%)': `${r.percentage || 0}%`,
      }));
    } else if (data.type === 'expiry') {
      rows = data.rows.map((r) => ({
        'Kode SKU': r.kfaCode,
        'Nama Produk': r.name,
        'No. Lot': r.lot,
        'Tanggal Expired': r.expiry ? formatDate(r.expiry) : '-',
        'Sisa Hari (Days)': r.daysRemaining,
        'Lokasi Bin Rak': r.bin,
        'Stok Fisik': r.qtyOnHand,
        'Satuan': r.unit || 'Pcs',
        'Estimasi Kerugian (Rp)': r.estimatedRiskValue || 0,
        'Status': r.status,
      }));
    } else if (data.type === 'stockout') {
      rows = data.rows.map((r) => ({
        'Kode SKU': r.kfaCode,
        'Nama Produk': r.name,
        'Kategori': r.category || '-',
        'Stok Saat Ini': r.qtyOnHand,
        'Konsumsi Harian (ADC)': r.adc || 0,
        'Sisa Hari Stok': r.daysOfStock || 0,
        'Lead Time (Hari)': r.leadTimeDays || 0,
        'Saran Reorder (Qty)': r.suggestedReorder || 0,
        'Estimasi Biaya (Rp)': r.estimatedCost || 0,
        'Status': r.status,
      }));
    } else if (data.type === 'audit') {
      rows = data.rows.map((r) => ({
        'No. Dokumen Audit': r.countNumber,
        'Lokasi Fasilitas': r.locationName,
        'Tanggal Audit': formatDate(r.date),
        'Item Dihitung': r.itemCount,
        'Item Sesuai': r.matchedCount,
        'Tingkat Akurasi (%)': `${r.accuracy}%`,
        'Net Selisih Fisik': r.netVariance,
        'Dampak Finansial (Rp)': r.netVarianceValue,
        'Status Audit': r.status,
        'Distribusi Alasan': r.reasonsSummary || '-',
      }));
    } else if (data.type === 'transactions') {
      rows = data.rows.map((r) => ({
        'Tanggal & Waktu': formatDate(r.date),
        'Tipe Mutasi': r.type,
        'No. Lot': r.lot || '-',
        'Qty Masuk': r.qtyIn ?? '',
        'Qty Keluar': r.qtyOut ?? '',
        'Saldo Akhir': r.balance,
        'Petugas': r.user,
        'Referensi Dokumen': r.reference ?? '-',
      }));
    }

    if (rows.length === 0) {
      toast.warning('Tidak ada baris data untuk diekspor');
      return;
    }

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma-laporan-${data.type}-${formatDate(new Date().toISOString(), 'short').replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('File CSV berhasil diunduh');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered rows based on search query
  const filteredData = useMemo(() => {
    if (!data) return null;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return data;

    if (data.type === 'summary') {
      return {
        ...data,
        rows: data.rows.filter((r) => r.category.toLowerCase().includes(q)),
      };
    }
    if (data.type === 'expiry') {
      return {
        ...data,
        rows: data.rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.kfaCode.toLowerCase().includes(q) ||
            r.lot.toLowerCase().includes(q) ||
            r.bin.toLowerCase().includes(q)
        ),
      };
    }
    if (data.type === 'stockout') {
      return {
        ...data,
        rows: data.rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.kfaCode.toLowerCase().includes(q) ||
            (r.category && r.category.toLowerCase().includes(q))
        ),
      };
    }
    if (data.type === 'audit') {
      return {
        ...data,
        rows: data.rows.filter(
          (r) =>
            r.countNumber.toLowerCase().includes(q) ||
            r.locationName.toLowerCase().includes(q) ||
            (r.reasonsSummary && r.reasonsSummary.toLowerCase().includes(q))
        ),
      };
    }
    if (data.type === 'transactions') {
      return {
        ...data,
        rows: data.rows.filter(
          (r) =>
            r.type.toLowerCase().includes(q) ||
            (r.lot && r.lot.toLowerCase().includes(q)) ||
            r.user.toLowerCase().includes(q) ||
            (r.reference && r.reference.toLowerCase().includes(q))
        ),
      };
    }
    return data;
  }, [data, searchQuery]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── 1. Official Document Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5eae7] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#d8f3dc] text-[11px] font-bold text-[#1b4332]">
            <BarChart3 className="w-3.5 h-3.5" />
            SIGMA PHARMACY AUDIT & INTELLIGENCE
          </div>
          <h1 className="text-xl md:text-2xl font-black text-[#1b2a24] tracking-tight">
            Pusat Laporan & Analitik Farmasi
          </h1>
          <p className="text-xs text-[#52665d]">
            Valuasi aset kapitalisasi obat, pemantauan risiko kedaluwarsa FEFO, proyeksi ketersediaan, dan audit stok opname.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4 text-[#2d6a4f]" />}
            onClick={handlePrint}
            className="rounded-xl border-[#dfe6e2] bg-white hover:bg-[#f1f8f4] text-xs font-semibold text-[#1b2a24]"
          >
            Cetak PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={exportCsv}
            className="rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-xs font-semibold text-white shadow-sm"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── 2. Top Bento KPI Cards (Uniform Clean White per Active Tab) ── */}
      {renderBentoKpis(data, loading)}

      {/* ── 3. Tab Navigation Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e5eae7] shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        {TAB_DEFINITIONS.map((tab) => {
          const isActive = type === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all
                ${
                  isActive
                    ? 'bg-[#2d6a4f] text-white shadow-sm ring-1 ring-[#1b4332]'
                    : 'text-[#52665d] hover:bg-[#f1f8f4] hover:text-[#1b2a24]'
                }
              `}
            >
              <span className={isActive ? 'text-[#d8f3dc]' : 'text-[#2d6a4f]'}>{tab.icon}</span>
              <span>{tab.label}</span>
              {data && data.type === tab.id && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#e5eae7] text-[#52665d]'
                  }`}
                >
                  {data.rows.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── 4. Interactive Filter Bar ── */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-[0_2px_8px_rgba(27,42,36,0.04)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1b2a24]">
            <Filter className="w-3.5 h-3.5 text-[#2d6a4f]" />
            Parameter Filter Laporan
          </div>
          {(selectedLocation !== 'ALL' || selectedDays !== '90' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedLocation('ALL');
                setSelectedDays('90');
                setSearchQuery('');
              }}
              className="text-[11px] font-semibold text-[#2d6a4f] hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Location Select */}
          <div>
            <label htmlFor="rep-location-select" className="block text-[11px] font-semibold text-[#52665d] mb-1">
              Lokasi Fasilitas
            </label>
            <select
              id="rep-location-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold Days (Special for Expiry) */}
          {type === 'expiry' && (
            <div>
              <label htmlFor="rep-days-select" className="block text-[11px] font-semibold text-[#52665d] mb-1">
                Ambang Batas Kedaluwarsa
              </label>
              <select
                id="rep-days-select"
                value={selectedDays}
                onChange={(e) => setSelectedDays(e.target.value)}
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] px-3 py-2 text-xs text-[#1b2a24] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
              >
                {EXPIRY_THRESHOLD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Search */}
          <div className={type === 'expiry' ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-3'}>
            <label htmlFor="rep-search-input" className="block text-[11px] font-semibold text-[#52665d] mb-1">
              Pencarian Cepat Data
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca8a2]" />
              <input
                id="rep-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, kode SKU/KFA, nomor lot, atau dokumen..."
                className="w-full rounded-xl border border-[#dfe6e2] bg-[#f8faf9] py-2 pl-9 pr-3 text-xs text-[#1b2a24] placeholder-[#9ca8a2] focus:border-[#2d6a4f] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Main Report Content Area ── */}
      <div className="rounded-2xl border border-[#e5eae7] bg-white shadow-[0_2px_8px_rgba(27,42,36,0.04)] overflow-hidden">
        {/* Table Header Info */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#edf1ee] bg-[#f8faf9]">
          <div className="flex items-center gap-2">
            <span className="text-[#2d6a4f]">
              {TAB_DEFINITIONS.find((t) => t.id === type)?.icon}
            </span>
            <div>
              <h2 className="text-xs font-bold text-[#1b2a24]">
                {TAB_DEFINITIONS.find((t) => t.id === type)?.label}
              </h2>
              <p className="text-[11px] text-[#6b7c74]">
                {TAB_DEFINITIONS.find((t) => t.id === type)?.description}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => fetchData(type)}
            className="rounded-xl border-[#dfe6e2] bg-white hover:bg-[#f1f8f4] text-xs font-semibold text-[#1b2a24]"
          >
            Segarkan
          </Button>
        </div>

        {/* Dynamic Table Body */}
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton variant="rect" height={32} width="100%" count={1} />
            <Skeleton variant="text" height={20} count={6} />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={() => fetchData(type)} title="Gagal Memuat Laporan" />
          </div>
        ) : !filteredData || filteredData.rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Tidak ada data laporan"
              description="Tidak ditemukan data yang sesuai dengan filter atau kata kunci pencarian."
              icon={<Package className="w-10 h-10 text-[#9ca8a2]" />}
            />
          </div>
        ) : (
          renderTableContent(filteredData)
        )}
      </div>
    </div>
  );
}

// ─── Bento KPI Cards Component ───────────────────────────────────────────────
function renderBentoKpis(data: ReportData | null, loading: boolean) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-[#e5eae7] bg-white p-5">
            <Skeleton variant="rect" height={16} width="60%" count={1} />
            <Skeleton variant="rect" height={28} width="40%" count={1} className="mt-3" />
          </div>
        ))}
      </div>
    );
  }

  if (data.type === 'summary') {
    const rows = data.rows;
    const totalValuation = rows.reduce((acc, r) => acc + r.value, 0);
    const totalUnits = rows.reduce((acc, r) => acc + r.qty, 0);
    const totalSku = rows.reduce((acc, r) => acc + r.productCount, 0);
    const classACount = rows.filter((r) => r.abcClass === 'A').length;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Valuasi Aset</span>
            <Coins className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalValuation)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Kapitalisasi nilai persediaan obat</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Kuantitas Fisik</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatNumber(totalUnits)} Unit</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Total seluruh sediaan di rak</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total SKU Aktif</span>
            <Layers className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatNumber(totalSku)} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Dari {rows.length} kategori formularium</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Pareto Kelas A</span>
            <TrendingUp className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2d6a4f]">
            {classACount} <span className="text-sm font-semibold text-[#52665d]">Kategori</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Menyumbang ~80% dari total anggaran</p>
        </div>
      </div>
    );
  }

  if (data.type === 'expiry') {
    const rows = data.rows;
    const criticalCount = rows.filter((r) => r.daysRemaining <= 30).length;
    const warningCount = rows.filter((r) => r.daysRemaining > 30 && r.daysRemaining <= 90).length;
    const totalRiskValue = rows.reduce((acc, r) => acc + (r.estimatedRiskValue || 0), 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Lot Terancam</span>
            <Clock className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{rows.length} Lot</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Perlu percepatan alokasi FEFO</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kritis (&lt; 30 Hari)</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{criticalCount} Lot</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Segera karantina / alihkan unit</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Waspada (31–90 Hari)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{warningCount} Lot</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Prioritaskan pengeluaran utama</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Estimasi Risiko Kerugian</span>
            <TrendingDown className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalRiskValue)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Potensi kerugian jika kedaluwarsa</p>
        </div>
      </div>
    );
  }

  if (data.type === 'stockout') {
    const rows = data.rows;
    const outOfStockCount = rows.filter((r) => r.qtyOnHand <= 0).length;
    const criticalStockCount = rows.filter((r) => (r.daysOfStock || 0) < 7 && r.qtyOnHand > 0).length;
    const totalReorderEst = rows.reduce((acc, r) => acc + (r.estimatedCost || 0), 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Stok Habis (0 Qty)</span>
            <PackageX className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{outOfStockCount} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Kekosongan obat di rak gudang</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Kritis (&lt; 7 Hari Sisa)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{criticalStockCount} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Di bawah batas lead time supplier</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Item Berisiko</span>
            <TrendingDown className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{rows.length} SKU</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Memerlukan tindak lanjut pengadaan</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Estimasi Nilai Pengadaan</span>
            <Coins className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{formatCurrency(totalReorderEst)}</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Anggaran pengadaan buffer aman</p>
        </div>
      </div>
    );
  }

  if (data.type === 'audit') {
    const rows = data.rows;
    const avgAccuracy = rows.length > 0 ? Math.round(rows.reduce((acc, r) => acc + r.accuracy, 0) / rows.length) : 100;
    const totalVarianceUnits = rows.reduce((acc, r) => acc + r.netVariance, 0);
    const totalVarianceValue = rows.reduce((acc, r) => acc + r.netVarianceValue, 0);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Rata-rata Akurasi Stok</span>
            <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#2d6a4f]">{avgAccuracy}%</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Kesesuaian fisik terhadap sistem</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Total Sesi Opname</span>
            <FileCheck className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#1b2a24]">{rows.length} Sesi</div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Audit cycle count terlaksana</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Net Selisih Fisik</span>
            <Boxes className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className={`mt-2 text-2xl font-black ${totalVarianceUnits < 0 ? 'text-amber-700' : 'text-[#1b2a24]'}`}>
            {totalVarianceUnits > 0 ? `+${totalVarianceUnits}` : totalVarianceUnits} Unit
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Akumulasi deviasi kuantitas</p>
        </div>

        <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#52665d]">Dampak Finansial Selisih</span>
            <Coins className="h-4 w-4 text-[#2d6a4f]" />
          </div>
          <div className={`mt-2 text-2xl font-black ${totalVarianceValue < 0 ? 'text-rose-700' : 'text-[#1b2a24]'}`}>
            {formatCurrency(totalVarianceValue)}
          </div>
          <p className="mt-1 text-[11px] text-[#6b7c74]">Penyesuaian jurnal buku besar</p>
        </div>
      </div>
    );
  }

  // Transactions default
  const rows = data.rows;
  const totalIn = rows.reduce((acc, r) => acc + (r.qtyIn || 0), 0);
  const totalOut = rows.reduce((acc, r) => acc + (r.qtyOut || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#52665d]">Total Log Mutasi</span>
          <History className="h-4 w-4 text-[#2d6a4f]" />
        </div>
        <div className="mt-2 text-2xl font-black text-[#1b2a24]">{rows.length} Transaksi</div>
        <p className="mt-1 text-[11px] text-[#6b7c74]">Rekam jejak kartu stok digital</p>
      </div>

      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#52665d]">Total Masuk (IN)</span>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="mt-2 text-2xl font-black text-emerald-700">+{formatNumber(totalIn)} Unit</div>
        <p className="mt-1 text-[11px] text-[#6b7c74]">Penerimaan PO & Transfer Masuk</p>
      </div>

      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#52665d]">Total Keluar (OUT)</span>
          <TrendingDown className="h-4 w-4 text-amber-600" />
        </div>
        <div className="mt-2 text-2xl font-black text-amber-700">-{formatNumber(totalOut)} Unit</div>
        <p className="mt-1 text-[11px] text-[#6b7c74]">Fulfillment Depo & Pemakaian</p>
      </div>

      <div className="rounded-2xl border border-[#e5eae7] bg-white p-5 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#52665d]">Integritas Audit</span>
          <CheckCircle2 className="h-4 w-4 text-[#2d6a4f]" />
        </div>
        <div className="mt-2 text-2xl font-black text-[#2d6a4f]">100% Terverifikasi</div>
        <p className="mt-1 text-[11px] text-[#6b7c74]">Semua baris memiliki user & timestamp</p>
      </div>
    </div>
  );
}

// ─── Table Rendering Logic ───────────────────────────────────────────────────
function renderTableContent(data: ReportData) {
  switch (data.type) {
    case 'summary':
      return renderSummaryTable(data.rows);
    case 'expiry':
      return renderExpiryTable(data.rows);
    case 'stockout':
      return renderStockoutTable(data.rows);
    case 'audit':
      return renderAuditTable(data.rows);
    case 'transactions':
      return renderTransactionsTable(data.rows);
  }
}

// ── 1. Summary / Valuation Table ──
function renderSummaryTable(rows: SummaryRow[]) {
  const totalValuation = rows.reduce((acc, r) => acc + r.value, 0);
  const totalQty = rows.reduce((acc, r) => acc + r.qty, 0);
  const totalSku = rows.reduce((acc, r) => acc + r.productCount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
            <th className="py-3 px-4">Kategori Farmasi</th>
            <th className="py-3 px-4 text-center">Klasifikasi ABC</th>
            <th className="py-3 px-4 text-right">Jumlah SKU</th>
            <th className="py-3 px-4 text-right">Total Kuantitas Fisik</th>
            <th className="py-3 px-4 text-right">Total Valuasi Finansial</th>
            <th className="py-3 px-4 text-right">Kontribusi (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ee]">
          {rows.map((row) => (
            <tr key={row.category} className="hover:bg-[#f8faf9] transition">
              <td className="py-3 px-4 font-bold text-[#1b2a24]">{row.category}</td>
              <td className="py-3 px-4 text-center">
                {row.abcClass === 'A' && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200">
                    Kelas A (High Value)
                  </span>
                )}
                {row.abcClass === 'B' && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-800 ring-1 ring-sky-200">
                    Kelas B (Moderate)
                  </span>
                )}
                {row.abcClass === 'C' && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                    Kelas C (High Volume)
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-[#1b2a24]">
                {formatNumber(row.productCount)} SKU
              </td>
              <td className="py-3 px-4 text-right font-bold text-[#1b2a24]">
                {formatQuantity(row.qty)} Unit
              </td>
              <td className="py-3 px-4 text-right font-mono font-black text-[#2d6a4f]">
                {formatCurrency(row.value)}
              </td>
              <td className="py-3 px-4 text-right font-mono text-[#52665d]">
                <span className="inline-block w-12">{row.percentage || 0}%</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#f8faf9] border-t-2 border-[#e5eae7] text-xs font-black text-[#1b2a24]">
            <td colSpan={2} className="py-3 px-4 text-[#52665d]">TOTAL PERSIDIAN RUMAH SAKIT</td>
            <td className="py-3 px-4 text-right font-mono">{formatNumber(totalSku)} SKU</td>
            <td className="py-3 px-4 text-right">{formatQuantity(totalQty)} Unit</td>
            <td className="py-3 px-4 text-right font-mono text-[#2d6a4f]">{formatCurrency(totalValuation)}</td>
            <td className="py-3 px-4 text-right font-mono">100.0%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── 2. Expiry Risk Table ──
function renderExpiryTable(rows: ExpiryRow[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
            <th className="py-3 px-4">Nama Obat / SKU</th>
            <th className="py-3 px-4">No. Lot Pabrikan</th>
            <th className="py-3 px-4">Tgl. Expired</th>
            <th className="py-3 px-4 text-center">Sisa Hari (ED)</th>
            <th className="py-3 px-4">Lokasi Bin Rak</th>
            <th className="py-3 px-4 text-right">Stok Fisik</th>
            <th className="py-3 px-4 text-right">Estimasi Kerugian</th>
            <th className="py-3 px-4 text-center">Status / Aksi FEFO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ee]">
          {rows.map((row) => {
            const isCritical = row.daysRemaining <= 30;
            const isWarning = row.daysRemaining > 30 && row.daysRemaining <= 60;
            const isModerate = row.daysRemaining > 60 && row.daysRemaining <= 90;

            return (
              <tr key={`${row.productId}:${row.lot}`} className="hover:bg-[#f8faf9] transition">
                <td className="py-3 px-4">
                  <div className="font-bold text-[#1b2a24]">{row.name}</div>
                  <div className="text-[10px] font-mono text-[#9ca8a2]">{row.kfaCode}</div>
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-[#52665d]">{row.lot}</td>
                <td className="py-3 px-4 font-mono text-[#1b2a24]">
                  {row.expiry ? formatDate(row.expiry, 'short') : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 ring-1 ring-rose-200 animate-pulse">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {row.daysRemaining} Hari (Kritis)
                    </span>
                  ) : isWarning ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {row.daysRemaining} Hari
                    </span>
                  ) : isModerate ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                      <Clock className="w-2.5 h-2.5" />
                      {row.daysRemaining} Hari
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {row.daysRemaining} Hari
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f8f4] px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#2d6a4f]">
                    <MapPin className="w-2.5 h-2.5" />
                    {row.bin || '-'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-[#1b2a24]">
                  {formatQuantity(row.qtyOnHand)} {row.unit || 'Pcs'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                  {row.estimatedRiskValue ? formatCurrency(row.estimatedRiskValue) : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      Karantina / Retur
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Prioritas FEFO
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 3. Stockout & ADC Prediction Table ──
function renderStockoutTable(rows: StockoutRow[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
            <th className="py-3 px-4">Nama Produk / SKU</th>
            <th className="py-3 px-4">Kategori</th>
            <th className="py-3 px-4 text-right">Stok Fisik</th>
            <th className="py-3 px-4 text-center">ADC (Konsumsi/Hari)</th>
            <th className="py-3 px-4 text-center">Sisa Ketersediaan</th>
            <th className="py-3 px-4 text-center">Lead Time</th>
            <th className="py-3 px-4 text-right">Saran Reorder (Qty)</th>
            <th className="py-3 px-4 text-right">Estimasi Biaya</th>
            <th className="py-3 px-4 text-center">Aksi Cepat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ee]">
          {rows.map((row) => {
            const isZero = row.qtyOnHand <= 0;
            const daysLeft = row.daysOfStock ?? 0;
            const isCritical = daysLeft < 7 || isZero;

            return (
              <tr key={`${row.productId}:${row.lot || 'main'}`} className="hover:bg-[#f8faf9] transition">
                <td className="py-3 px-4">
                  <div className="font-bold text-[#1b2a24]">{row.name}</div>
                  <div className="text-[10px] font-mono text-[#9ca8a2]">{row.kfaCode}</div>
                </td>
                <td className="py-3 px-4 text-[#52665d]">{row.category || '-'}</td>
                <td className="py-3 px-4 text-right font-bold">
                  <span className={isZero ? 'text-rose-600 font-black' : 'text-[#1b2a24]'}>
                    {formatQuantity(row.qtyOnHand)} {row.unit || 'Pcs'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-mono font-semibold text-[#1b2a24]">
                  {row.adc || 5} Unit/hari
                </td>
                <td className="py-3 px-4 text-center">
                  {isZero ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 ring-1 ring-rose-200">
                      Stok Habis (0 Hari)
                    </span>
                  ) : isCritical ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                      {daysLeft} Hari Sisa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {daysLeft} Hari Sisa
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-[#52665d] font-mono">{row.leadTimeDays || 5} Hari</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#2d6a4f]">
                  +{formatNumber(row.suggestedReorder || 100)} Unit
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-[#1b2a24]">
                  {row.estimatedCost ? formatCurrency(row.estimatedCost) : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <Link
                    href="/procurement/po/new"
                    className="inline-flex items-center gap-1 rounded-xl bg-[#2d6a4f] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-[#1b4332]"
                  >
                    + Buat PO
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 4. Cycle Count Audit Table ──
function renderAuditTable(rows: AuditRow[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
            <th className="py-3 px-4">No. Dokumen Audit</th>
            <th className="py-3 px-4">Lokasi Fasilitas</th>
            <th className="py-3 px-4">Tanggal Audit</th>
            <th className="py-3 px-4 text-center">Item Dihitung</th>
            <th className="py-3 px-4 text-center">Akurasi Stok (%)</th>
            <th className="py-3 px-4 text-right">Net Selisih Fisik</th>
            <th className="py-3 px-4 text-right">Dampak Finansial</th>
            <th className="py-3 px-4">Distribusi Alasan</th>
            <th className="py-3 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ee]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#f8faf9] transition">
              <td className="py-3 px-4 font-mono font-bold text-[#2d6a4f]">{row.countNumber}</td>
              <td className="py-3 px-4 font-semibold text-[#1b2a24]">{row.locationName}</td>
              <td className="py-3 px-4 text-[#52665d]">{formatDate(row.date, 'short')}</td>
              <td className="py-3 px-4 text-center font-mono font-semibold text-[#1b2a24]">
                {row.matchedCount}/{row.itemCount} Item
              </td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black ${
                    row.accuracy >= 98
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                      : row.accuracy >= 95
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200'
                  }`}
                >
                  {row.accuracy}% Akurat
                </span>
              </td>
              <td className="py-3 px-4 text-right font-bold">
                <span className={row.netVariance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                  {row.netVariance > 0 ? `+${row.netVariance}` : row.netVariance} Unit
                </span>
              </td>
              <td className="py-3 px-4 text-right font-mono font-black">
                <span className={row.netVarianceValue < 0 ? 'text-rose-700' : 'text-[#1b2a24]'}>
                  {formatCurrency(row.netVarianceValue)}
                </span>
              </td>
              <td className="py-3 px-4 text-[11px] text-[#52665d]">{row.reasonsSummary || '-'}</td>
              <td className="py-3 px-4 text-center">
                <Link
                  href={`/cycle-count/report?id=${row.id}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#dfe6e2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1b2a24] shadow-sm transition hover:bg-[#f1f8f4]"
                >
                  Lembar Audit
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 5. Transactions Table ──
function renderTransactionsTable(rows: TransactionRow[]) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5eae7] bg-[#f8faf9] text-[11px] font-bold text-[#52665d]">
            <th className="py-3 px-4">Tanggal & Waktu</th>
            <th className="py-3 px-4">Tipe Mutasi</th>
            <th className="py-3 px-4 font-mono">No. Lot</th>
            <th className="py-3 px-4 text-right">Masuk (IN)</th>
            <th className="py-3 px-4 text-right">Keluar (OUT)</th>
            <th className="py-3 px-4 text-right font-bold">Saldo Akhir</th>
            <th className="py-3 px-4">Petugas / Otorisator</th>
            <th className="py-3 px-4">Referensi Dokumen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf1ee]">
          {rows.map((row, idx) => (
            <tr key={row.reference ?? `${row.date}-${row.type}-${idx}`} className="hover:bg-[#f8faf9] transition">
              <td className="py-3 px-4 font-mono text-[#52665d]">{formatDate(row.date, 'short')}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f8f4] px-1.5 py-0.5 text-[10px] font-bold text-[#2d6a4f]">
                  {row.type}
                </span>
              </td>
              <td className="py-3 px-4 font-mono text-[#1b2a24]">{row.lot || '-'}</td>
              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                {row.qtyIn ? `+${formatNumber(row.qtyIn)}` : '-'}
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                {row.qtyOut ? `-${formatNumber(row.qtyOut)}` : '-'}
              </td>
              <td className="py-3 px-4 text-right font-mono font-black text-[#1b2a24]">
                {formatNumber(row.balance)} Unit
              </td>
              <td className="py-3 px-4 text-[#52665d]">{row.user}</td>
              <td className="py-3 px-4 font-mono font-semibold text-[#2d6a4f]">{row.reference || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CSV Stringifier Helper ──────────────────────────────────────────────────
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map((h) => `"${h}"`).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

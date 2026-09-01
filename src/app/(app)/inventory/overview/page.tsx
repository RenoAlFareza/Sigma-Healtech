import type { Metadata } from 'next';
import { InventorySummary } from '@/features/inventory/InventorySummary';

export const metadata: Metadata = {
  title: 'Ringkasan Persediaan (Inventory Summary) — SIGMA',
  description: 'Laporan ringkasan persediaan medis, status stok, kuantitas ATP, dan valuasi aset per lokasi.',
};

export default function InventoryOverviewPage() {
  return <InventorySummary />;
}

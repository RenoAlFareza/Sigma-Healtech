import type { Metadata } from 'next';
import { InventoryOverview } from '@/features/inventory/InventoryOverview';

export const metadata: Metadata = {
  title: 'Overview Inventory — SIGMA',
  description: 'Visual kondisi persediaan dan pergerakan stok masuk per lokasi.',
};

export default function InventoryOverviewPage() {
  return <InventoryOverview />;
}

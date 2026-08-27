import type { Metadata } from 'next';
import { InventoryBrowser } from '@/features/inventory/InventoryBrowser';

export const metadata: Metadata = {
  title: 'Inventory — SIGMA',
  description: 'Browse location-scoped stock.',
};

export default function InventoryPage() {
  return (
    <div className="p-6">
      <InventoryBrowser />
    </div>
  );
}
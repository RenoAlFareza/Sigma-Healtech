import type { Metadata } from 'next';
import { InventoryBrowser } from '@/features/inventory/InventoryBrowser';

export const metadata: Metadata = {
  title: 'Inventory — SIGMA',
  description: 'Browse location-scoped stock.',
};

const INVENTORY_STATUSES = ['ALL', 'IN_STOCK', 'LOW_STOCK', 'STOCKOUT', 'EXPIRING', 'EXPIRED'];

export default async function InventoryPage({ searchParams }: PageProps<'/inventory'>) {
  const params = await searchParams;
  const requestedStatus = typeof params.status === 'string' ? params.status : 'ALL';
  const normalizedStatus = requestedStatus === 'OUT_OF_STOCK' ? 'STOCKOUT' : requestedStatus;
  const initialStatus = INVENTORY_STATUSES.includes(normalizedStatus) ? normalizedStatus : 'ALL';
  const showStockCardGuide = params.view === 'stock-card';

  return (
    <div className="w-full">
      <InventoryBrowser
        key={`${initialStatus}:${showStockCardGuide}`}
        initialStatus={initialStatus}
        showStockCardGuide={showStockCardGuide}
      />
    </div>
  );
}

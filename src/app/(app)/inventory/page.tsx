import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { InventoryBrowser } from '@/features/inventory/InventoryBrowser';

export const metadata: Metadata = {
  title: 'Inventory — SIGMA',
  description: 'Browse location-scoped stock.',
};

const INVENTORY_STATUSES = ['ALL', 'ACTIVE', 'IN_STOCK', 'LOW_STOCK', 'STOCKOUT', 'EXPIRING', 'EXPIRED', 'UNASSIGNED_BIN', 'NEGATIVE'];

export default async function InventoryPage({ searchParams }: PageProps<'/inventory'>) {
  const params = await searchParams;
  const hasDetailRequest = typeof params.status === 'string' || params.view === 'details' || params.view === 'stock-card';
  if (!hasDetailRequest) redirect('/inventory/overview');

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

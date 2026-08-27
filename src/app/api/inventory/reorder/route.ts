import { getStockForLocation } from '@/api/_fixtures/inventory';
import { getStockStatus } from '@/features/inventory/stockStatus';
import { NextResponse } from 'next/server';

const DEFAULT_REORDER_POINT = 10;
const DEFAULT_MAX = 50;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }

  const items = getStockForLocation(locationId);

  // Aggregate qty per product within the location.
  const byProduct = new Map<string, { qtyOnHand: number; product: (typeof items)[number]['product']; minExpiry?: string }>();
  for (const it of items) {
    const entry = byProduct.get(it.product.id) ?? {
      qtyOnHand: 0,
      product: it.product,
      minExpiry: undefined as string | undefined,
    };
    entry.qtyOnHand += it.qtyOnHand;
    if (it.expiry && (!entry.minExpiry || it.expiry < entry.minExpiry)) entry.minExpiry = it.expiry;
    byProduct.set(it.product.id, entry);
  }

  const report = Array.from(byProduct.values())
    .map((entry) => {
      const reorderPoint = DEFAULT_REORDER_POINT;
      const suggestedQty = Math.max(0, DEFAULT_MAX - entry.qtyOnHand);
      const status = getStockStatus({ qtyOnHand: entry.qtyOnHand, expiry: entry.minExpiry });
      return {
        product: entry.product,
        qtyOnHand: entry.qtyOnHand,
        reorderPoint,
        suggestedQty,
        status: status === 'EXPIRED' || status === 'EXPIRING' ? status : entry.qtyOnHand <= reorderPoint ? 'LOW_STOCK' : 'IN_STOCK',
      };
    })
    // Only items that are actually below reorder point or out of stock.
    .filter((r) => r.qtyOnHand <= r.reorderPoint || r.status === 'EXPIRED' || r.status === 'EXPIRING');

  return NextResponse.json({
    data: report,
    totalCount: report.length,
  });
}
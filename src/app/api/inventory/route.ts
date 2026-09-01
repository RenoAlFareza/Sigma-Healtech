import { getStockForLocation } from '@/api/_fixtures/inventory';
import { getStockStatus } from '@/features/inventory/stockStatus';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const keyword = searchParams.get('keyword')?.toLowerCase() || '';
  const category = searchParams.get('category')?.toLowerCase() || '';
  const statusFilter = searchParams.get('status')?.toUpperCase() || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const sizeParam = parseInt(searchParams.get('size') || '20', 10);

  if (!locationId) {
    return NextResponse.json(
      { error: 'locationId is required' },
      { status: 400 }
    );
  }

  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const size = isNaN(sizeParam) || sizeParam < 1 ? 20 : sizeParam;

  let items = getStockForLocation(locationId);

  // Derive live status for each item.
  items = items.map((it) => ({
    ...it,
    status: getStockStatus({ qtyOnHand: it.qtyOnHand, expiry: it.expiry }),
  }));

  if (keyword) {
    items = items.filter(
      (it) =>
        it.product.name.toLowerCase().includes(keyword) ||
        it.product.kfaCode.toLowerCase().includes(keyword) ||
        it.lot.toLowerCase().includes(keyword)
    );
  }

  if (category && category !== 'all') {
    items = items.filter((it) => it.product.category.toLowerCase().includes(category));
  }

  if (statusFilter === 'ACTIVE') {
    items = items.filter((it) => it.qtyOnHand > 0 && it.status !== 'EXPIRED');
  } else if (statusFilter === 'UNASSIGNED_BIN') {
    items = items.filter((it) => it.qtyOnHand > 0 && !it.bin.trim());
  } else if (statusFilter === 'NEGATIVE') {
    items = items.filter((it) => it.qtyOnHand < 0);
  } else if (statusFilter) {
    items = items.filter((it) => it.status === statusFilter);
  }

  const totalCount = items.length;
  const startIndex = (page - 1) * size;
  const paginatedData = items.slice(startIndex, startIndex + size);

  return NextResponse.json({
    data: paginatedData,
    totalCount,
  });
}

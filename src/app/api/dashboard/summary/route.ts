import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';
import { getStockForLocation } from '@/api/_fixtures/inventory';
import { getStockStatus } from '@/features/inventory/stockStatus';

export async function GET(request: Request) {
  const { products, locations } = getDb();
  const requestedLocationId = new URL(request.url).searchParams.get('locationId');
  const selectedLocations = requestedLocationId
    ? locations.filter((location) => location.id === requestedLocationId)
    : locations;
  const stock = selectedLocations.flatMap((location) => getStockForLocation(location.id))
    .map((item) => ({ ...item, status: getStockStatus({ qtyOnHand: item.qtyOnHand, expiry: item.expiry }) }));
  const activeStock = stock.filter((item) => item.qtyOnHand > 0 && item.status !== 'EXPIRED');

  const totalProducts = products.length;
  const activeInventoryQuantity = activeStock.reduce((sum, item) => sum + item.qtyOnHand, 0);
  const activeLotCount = new Set(activeStock.map((item) => `${item.product.id}:${item.lot}:${item.bin}`)).size;
  const activeBinCount = new Set(activeStock.map((item) => item.bin).filter(Boolean)).size;
  const stockedSkuCount = new Set(activeStock.map((item) => item.product.id)).size;
  const lowStockCount = new Set(stock.filter((item) => item.status === 'LOW_STOCK').map((item) => item.product.id)).size;
  const stockoutCount = new Set(stock.filter((item) => item.status === 'STOCKOUT').map((item) => item.product.id)).size;
  const expiring30DaysCount = new Set(stock.filter((item) => item.status === 'EXPIRING').map((item) => item.product.id)).size;

  return NextResponse.json({
    totalProducts,
    activeInventoryQuantity,
    activeLotCount,
    activeBinCount,
    stockedSkuCount,
    locationId: requestedLocationId,
    locationName: selectedLocations.length === 1 ? selectedLocations[0].name : 'Seluruh Lokasi',
    lowStockCount,
    stockoutCount,
    expiring30DaysCount,
    pendingRequisitionsCount: 7,
    fillRatePercentage: 97.4,
  });
}

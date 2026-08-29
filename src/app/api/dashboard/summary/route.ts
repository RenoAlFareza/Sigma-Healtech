import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';
import { getStockForLocation } from '@/api/_fixtures/inventory';
import { getStockStatus } from '@/features/inventory/stockStatus';
import { listReceipts } from '@/api/_fixtures/inbound';
import { listMovements } from '@/api/_fixtures/outbound';
import { listRequisitions } from '@/api/_fixtures/requisitions';

function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function GET(request: Request) {
  const { products, locations } = getDb();
  const requestedLocationId = new URL(request.url).searchParams.get('locationId');
  const selectedLocations = requestedLocationId
    ? locations.filter((location) => location.id === requestedLocationId)
    : locations;
  const stock = selectedLocations.flatMap((location) => getStockForLocation(location.id))
    .map((item) => ({ ...item, status: getStockStatus({ qtyOnHand: item.qtyOnHand, expiry: item.expiry }) }));
  const activeStock = stock.filter((item) => safeNumber(item.qtyOnHand) > 0 && item.status !== 'EXPIRED');

  const totalProducts = products.length;
  const activeInventoryQuantity = activeStock.reduce((sum, item) => sum + safeNumber(item.qtyOnHand), 0);
  const activeLotCount = new Set(activeStock.map((item) => `${item.product.id}:${item.lot}:${item.bin}`)).size;
  const activeBinCount = new Set(activeStock.map((item) => item.bin).filter(Boolean)).size;
  const stockedSkuCount = new Set(activeStock.map((item) => item.product.id)).size;
  const lowStockCount = new Set(stock.filter((item) => item.status === 'LOW_STOCK').map((item) => item.product.id)).size;
  const stockoutCount = new Set(stock.filter((item) => item.status === 'STOCKOUT').map((item) => item.product.id)).size;
  const expiring30DaysCount = new Set(stock.filter((item) => item.status === 'EXPIRING').map((item) => item.product.id)).size;
  const openInboundReceipts = listReceipts({ destinationLocationId: requestedLocationId || undefined })
    .filter((receipt) => receipt.status === 'CREATED' || receipt.status === 'RECEIVING');
  const openInboundQuantity = openInboundReceipts.reduce(
    (receiptTotal, receipt) => receiptTotal + receipt.items.reduce(
      (itemTotal, item) => itemTotal + Math.max(safeNumber(item.qtyExpected) - safeNumber(item.qtyReceived), 0),
      0
    ),
    0
  );
  const inProgressShipments = listMovements({ originId: requestedLocationId || undefined })
    .filter((movement) => movement.status !== 'RECEIVED');
  const inProgressShipmentQuantity = inProgressShipments.reduce(
    (movementTotal, movement) => movementTotal + movement.items.reduce(
      (itemTotal, item) => itemTotal + safeNumber(item.qty),
      0
    ),
    0
  );
  const inProgressRequisitionStatuses = new Set(['SUBMITTED', 'APPROVED', 'PICKING', 'ISSUED']);
  const locationRequisitions = listRequisitions({ destinationId: requestedLocationId || undefined });
  const inProgressRequisitions = locationRequisitions
    .filter((requisition) => inProgressRequisitionStatuses.has(requisition.status));
  const inProgressRequisitionQuantity = inProgressRequisitions.reduce(
    (requisitionTotal, requisition) => requisitionTotal + requisition.items.reduce(
      (itemTotal, item) => itemTotal + safeNumber(item.qtyRequested),
      0
    ),
    0
  );

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
    openInboundQuantity,
    openInboundReceiptCount: openInboundReceipts.length,
    inProgressShipmentCount: inProgressShipments.length,
    inProgressShipmentQuantity,
    inProgressRequisitionCount: inProgressRequisitions.length,
    inProgressRequisitionQuantity,
    pendingRequisitionsCount: locationRequisitions.filter((requisition) => requisition.status === 'SUBMITTED').length,
    fillRatePercentage: 97.4,
  });
}

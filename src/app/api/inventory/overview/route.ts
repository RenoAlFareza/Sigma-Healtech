import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';
import { getStockForLocation } from '@/api/_fixtures/inventory';
import { listReceipts } from '@/api/_fixtures/inbound';
import { listMovements } from '@/api/_fixtures/outbound';
import { listTransfers } from '@/api/_fixtures/transfers';
import { listRequisitions } from '@/api/_fixtures/requisitions';
import { getStockStatus } from '@/features/inventory/stockStatus';

function safeNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sumQuantity(items: Array<{ qty?: number }>): number {
  return items.reduce((total, item) => total + safeNumber(item.qty), 0);
}

function isMedicalSupplyCategory(category: string): boolean {
  return /(alkes|alat kesehatan|bmhp|medis|syringe|reagen|vaksin)/i.test(category);
}

export async function GET(request: Request) {
  const locationId = new URL(request.url).searchParams.get('locationId');
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }

  const { locations, products } = getDb();
  const location = locations.find((item) => item.id === locationId);
  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  const stock = getStockForLocation(locationId).map((item) => ({
    ...item,
    status: getStockStatus({ qtyOnHand: safeNumber(item.qtyOnHand), expiry: item.expiry }),
  }));
  const openReceipts = listReceipts({ destinationLocationId: locationId })
    .filter((receipt) => receipt.status === 'CREATED' || receipt.status === 'RECEIVING');
  const incomingShipments = listMovements()
    .filter((movement) => movement.destinationId === locationId && movement.status !== 'RECEIVED');
  const incomingTransfers = listTransfers()
    .filter((transfer) => transfer.destinationId === locationId && transfer.status !== 'COMPLETED');
  const locationRequests = listRequisitions({ destinationId: locationId });
  const openRequestStatuses = new Set(['SUBMITTED', 'APPROVED', 'PICKING', 'ISSUED']);
  const openRequests = locationRequests.filter((item) => openRequestStatuses.has(item.status));
  const receivingQuantity = openReceipts.reduce(
    (receiptTotal, receipt) => receiptTotal + receipt.items.reduce(
      (itemTotal, item) => itemTotal + Math.max(safeNumber(item.qtyExpected) - safeNumber(item.qtyReceived), 0),
      0
    ),
    0
  );
  const expiredLots = stock.filter((item) => safeNumber(item.qtyOnHand) > 0 && item.status === 'EXPIRED');
  const openRequestQuantity = openRequests.reduce(
    (requestTotal, requisition) => requestTotal + requisition.items.reduce(
      (itemTotal, item) => itemTotal + safeNumber(item.qtyRequested),
      0
    ),
    0
  );
  const fulfilledRequestQuantity = openRequests.reduce(
    (requestTotal, requisition) => requestTotal + requisition.items.reduce(
      (itemTotal, item) => itemTotal + safeNumber(item.qtyIssued ?? item.qtyApproved),
      0
    ),
    0
  );
  const awaitingApproval = locationRequests.filter((item) => item.status === 'SUBMITTED');

  const distinctProducts = (productIds: string[]) => new Set(productIds).size;
  const metrics = {
    receivingProducts: distinctProducts(openReceipts.flatMap((receipt) => receipt.items.map((item) => item.productId))),
    receivingQuantity,
    receivingDocuments: openReceipts.length,
    unassignedBinProducts: distinctProducts(stock
      .filter((item) => safeNumber(item.qtyOnHand) > 0 && !item.bin.trim())
      .map((item) => item.product.id)),
    negativeInventoryProducts: distinctProducts(stock
      .filter((item) => safeNumber(item.qtyOnHand) < 0)
      .map((item) => item.product.id)),
    expiredProducts: distinctProducts(stock
      .filter((item) => safeNumber(item.qtyOnHand) > 0 && item.status === 'EXPIRED')
      .map((item) => item.product.id)),
    expiredLots: expiredLots.length,
    expiredQuantity: expiredLots.reduce((total, item) => total + safeNumber(item.qtyOnHand), 0),
    expiredValue: expiredLots.reduce(
      (total, item) => total + safeNumber(item.qtyOnHand) * safeNumber(item.product.price),
      0
    ),
    openStockRequests: openRequests.length,
    openRequestQuantity,
    fillRate: openRequestQuantity > 0 ? (fulfilledRequestQuantity / openRequestQuantity) * 100 : 0,
    awaitingApprovalRequests: awaitingApproval.length,
    awaitingApprovalQuantity: awaitingApproval.reduce(
      (requestTotal, requisition) => requestTotal + requisition.items.reduce(
        (itemTotal, item) => itemTotal + safeNumber(item.qtyRequested),
        0
      ),
      0
    ),
  };

  const incomingMovements = [
    ...openReceipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      reference: receipt.receiptNumber,
      name: receipt.referenceId ? `Penerimaan ${receipt.referenceId}` : 'Penerimaan dari supplier',
      source: receipt.sourceType,
      status: receipt.status,
      quantity: receipt.items.reduce(
        (total, item) => total + Math.max(safeNumber(item.qtyExpected) - safeNumber(item.qtyReceived), 0),
        0
      ),
      kind: 'SUPPLIER' as const,
      href: `/inbound?id=${encodeURIComponent(receipt.id)}`,
    })),
    ...incomingShipments.map((movement) => ({
      id: `shipment-${movement.id}`,
      reference: movement.movementNumber,
      name: `Kiriman dari ${locations.find((item) => item.id === movement.originId)?.name ?? movement.originId}`,
      source: movement.type,
      status: movement.status,
      quantity: sumQuantity(movement.items),
      kind: 'SHIPMENT' as const,
      href: '/outbound',
    })),
    ...incomingTransfers.map((transfer) => ({
      id: `transfer-${transfer.id}`,
      reference: transfer.transferNumber,
      name: `Transfer dari ${locations.find((item) => item.id === transfer.originId)?.name ?? transfer.originId}`,
      source: 'TRANSFER ANTAR LOKASI',
      status: transfer.status,
      quantity: sumQuantity(transfer.items),
      kind: 'TRANSFER' as const,
      href: '/transfers',
    })),
  ];

  const healthConfig = [
    { status: 'IN_STOCK', label: 'Sehat', tone: 'success' as const },
    { status: 'LOW_STOCK', label: 'Stok Menipis', tone: 'warning' as const },
    { status: 'STOCKOUT', label: 'Stok Habis', tone: 'danger' as const },
    { status: 'EXPIRING', label: 'Akan Kedaluwarsa', tone: 'info' as const },
    { status: 'EXPIRED', label: 'Kedaluwarsa', tone: 'muted' as const },
  ];
  const stockHealth = healthConfig.map((entry) => ({
    label: entry.label,
    value: stock.filter((item) => item.status === entry.status).length,
    tone: entry.tone,
  }));

  const categoryMap = new Map<string, { quantity: number; productIds: Set<string> }>();
  for (const item of stock) {
    const quantity = Math.max(safeNumber(item.qtyOnHand), 0);
    if (quantity === 0) continue;
    const category = item.product.category || 'Lainnya';
    const entry = categoryMap.get(category) ?? { quantity: 0, productIds: new Set<string>() };
    entry.quantity += quantity;
    entry.productIds.add(item.product.id);
    categoryMap.set(category, entry);
  }
  const categoryDistribution = Array.from(categoryMap.entries())
    .map(([category, entry]) => ({
      category,
      quantity: entry.quantity,
      productCount: entry.productIds.size,
    }))
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 4);

  const productById = new Map(products.map((product) => [product.id, product]));
  const splitIncomingItems = (
    items: Array<{ productId: string; quantity: number }>
  ) => items.reduce(
    (result, item) => {
      const category = productById.get(item.productId)?.category ?? '';
      if (isMedicalSupplyCategory(category)) result.medicalSupplyQuantity += safeNumber(item.quantity);
      else result.pharmacyQuantity += safeNumber(item.quantity);
      return result;
    },
    { pharmacyQuantity: 0, medicalSupplyQuantity: 0 }
  );

  const supplierSplit = splitIncomingItems(openReceipts.flatMap((receipt) => receipt.items.map((item) => ({
    productId: item.productId,
    quantity: Math.max(safeNumber(item.qtyExpected) - safeNumber(item.qtyReceived), 0),
  }))));
  const shipmentSplit = splitIncomingItems(incomingShipments.flatMap((movement) => movement.items.map((item) => ({
    productId: item.productId,
    quantity: safeNumber(item.qty),
  }))));
  const transferSplit = splitIncomingItems(incomingTransfers.flatMap((transfer) => transfer.items.map((item) => ({
    productId: item.productId,
    quantity: safeNumber(item.qty),
  }))));

  const incomingPipeline = [
    {
      key: 'supplier' as const,
      label: 'Supplier',
      count: openReceipts.length,
      quantity: incomingMovements.filter((item) => item.kind === 'SUPPLIER').reduce((total, item) => total + safeNumber(item.quantity), 0),
      ...supplierSplit,
      tone: 'green' as const,
    },
    {
      key: 'shipment' as const,
      label: 'Kiriman Unit',
      count: incomingShipments.length,
      quantity: incomingMovements.filter((item) => item.kind === 'SHIPMENT').reduce((total, item) => total + safeNumber(item.quantity), 0),
      ...shipmentSplit,
      tone: 'blue' as const,
    },
    {
      key: 'transfer' as const,
      label: 'Transfer',
      count: incomingTransfers.length,
      quantity: incomingMovements.filter((item) => item.kind === 'TRANSFER').reduce((total, item) => total + safeNumber(item.quantity), 0),
      ...transferSplit,
      tone: 'teal' as const,
    },
  ];

  const requestPipelineConfig = [
    { status: 'SUBMITTED' as const, label: 'Diajukan', tone: 'blue' as const },
    { status: 'APPROVED' as const, label: 'Disetujui', tone: 'green' as const },
    { status: 'PICKING' as const, label: 'Picking', tone: 'teal' as const },
    { status: 'ISSUED' as const, label: 'Dikeluarkan', tone: 'dark' as const },
  ];
  const requestPipeline = requestPipelineConfig.map((entry) => {
    const requests = locationRequests.filter((requestItem) => requestItem.status === entry.status);
    return {
      status: entry.status,
      label: entry.label,
      count: requests.length,
      quantity: requests.reduce(
        (requestTotal, requisition) => requestTotal + requisition.items.reduce(
          (itemTotal, item) => itemTotal + safeNumber(item.qtyRequested),
          0
        ),
        0
      ),
      tone: entry.tone,
    };
  });

  const demandFulfillment = locationRequests.map((requisition) => {
    const origin = locations.find((item) => item.id === requisition.originId);
    return {
      label: origin?.code ?? requisition.originId,
      requested: requisition.items.reduce((total, item) => total + safeNumber(item.qtyRequested), 0),
      fulfilled: requisition.items.reduce(
        (total, item) => total + safeNumber(item.qtyIssued ?? item.qtyApproved),
        0
      ),
    };
  });

  const expiryAction = [...stock]
    .filter((item) => safeNumber(item.qtyOnHand) > 0 && (item.status === 'EXPIRED' || item.status === 'EXPIRING'))
    .sort((left, right) => String(left.expiry ?? '').localeCompare(String(right.expiry ?? '')))[0];
  const reorderAction = [...stock]
    .filter((item) => item.status === 'STOCKOUT' || item.status === 'LOW_STOCK')
    .sort((left, right) => safeNumber(left.qtyOnHand) - safeNumber(right.qtyOnHand))[0];
  const approvalAction = awaitingApproval[0];
  const criticalActions = [
    expiryAction ? {
      id: `expiry-${expiryAction.id}`,
      kind: 'EXPIRY' as const,
      title: `${expiryAction.product.name} (${expiryAction.lot})`,
      description: `${expiryAction.status === 'EXPIRED' ? 'Sudah kedaluwarsa' : `Kedaluwarsa ${expiryAction.expiry ?? '-'}`} · ${safeNumber(expiryAction.qtyOnHand)} ${expiryAction.product.uom || 'unit'}`,
      actionLabel: expiryAction.status === 'EXPIRED' ? 'Retur' : 'Review',
      href: `/inventory?status=${expiryAction.status}`,
      tone: 'danger' as const,
    } : null,
    reorderAction ? {
      id: `reorder-${reorderAction.id}`,
      kind: 'REORDER' as const,
      title: reorderAction.product.name,
      description: `Sisa stok ${safeNumber(reorderAction.qtyOnHand)} ${reorderAction.product.uom || 'unit'} · ${reorderAction.status === 'STOCKOUT' ? 'Stok habis' : 'Di bawah batas aman'}`,
      actionLabel: 'Reorder',
      href: '/inventory/reorder',
      tone: 'warning' as const,
    } : null,
    approvalAction ? {
      id: `approval-${approvalAction.id}`,
      kind: 'APPROVAL' as const,
      title: `${approvalAction.requestNumber} · ${locations.find((item) => item.id === approvalAction.originId)?.name ?? approvalAction.originId}`,
      description: `${approvalAction.items.length} item · ${approvalAction.items.reduce((total, item) => total + safeNumber(item.qtyRequested), 0)} unit · ${approvalAction.priority}`,
      actionLabel: 'Setujui',
      href: `/requisitions/${encodeURIComponent(approvalAction.id)}`,
      tone: 'approval' as const,
    } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return NextResponse.json({
    locationId,
    locationName: location.name,
    metrics,
    incomingSourceCounts: {
      supplier: openReceipts.length,
      shipment: incomingShipments.length,
      transfer: incomingTransfers.length,
    },
    incomingMovements,
    stockHealth,
    categoryDistribution,
    incomingPipeline,
    requestPipeline,
    demandFulfillment,
    criticalActions,
  });
}

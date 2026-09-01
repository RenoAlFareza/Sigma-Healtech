import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';
import { getStockForLocation } from '@/api/_fixtures/inventory';
import { listRequisitions } from '@/api/_fixtures/requisitions';

function safeNumber(value: unknown) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function sum(values: number[]) { return values.reduce((total, value) => total + safeNumber(value), 0); }
function startOfDay(date: Date) { const result = new Date(date); result.setHours(0, 0, 0, 0); return result; }
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const locationId = search.get('locationId');
  if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  const { locations, products } = getDb();
  const location = locations.find((item) => item.id === locationId);
  if (!location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  const period = search.get('period') ?? '30D';
  const selectedUnit = search.get('unit') ?? 'ALL';
  const selectedCategory = search.get('category') ?? 'ALL';
  const selectedPriority = search.get('priority') ?? 'ALL';
  const selectedStatus = search.get('status') ?? 'ALL';
  const selectedThreshold = search.get('threshold') ?? 'ALL';
  const now = new Date();
  const cutoffDays = period === '7D' ? 6 : period === '30D' ? 29 : null;
  const cutoff = cutoffDays === null ? null : startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - cutoffDays));
  const stock = getStockForLocation(locationId);
  const stockByProduct = new Map<string, number>();
  for (const item of stock) stockByProduct.set(item.product.id, (stockByProduct.get(item.product.id) ?? 0) + Math.max(safeNumber(item.qtyOnHand) - safeNumber(item.qtyReserved), 0));
  const productById = new Map(products.map((product) => [product.id, product]));

  const locationRequests = listRequisitions({ destinationId: locationId }).filter((item) => !cutoff || new Date(item.createdAt) >= cutoff);
  const baseRows = locationRequests.flatMap((requisition) => requisition.items.map((line, index) => {
    const product = productById.get(line.productId);
    const requested = safeNumber(line.qtyRequested);
    const approved = safeNumber(line.qtyApproved);
    const issued = safeNumber(line.qtyIssued);
    const gap = Math.max(requested - issued, 0);
    const availableStock = stockByProduct.get(line.productId) ?? 0;
    const fillRate = requested > 0 ? issued / requested * 100 : 0;
    const fulfillmentStatus = issued >= requested && requested > 0 ? 'COMPLETE' : issued > 0 ? 'PARTIAL' : availableStock <= 0 && gap > 0 ? 'STOCKOUT' : 'PENDING';
    return {
      id: `${requisition.id}-${line.productId}-${index}`,
      requisitionId: requisition.id,
      requestNumber: requisition.requestNumber,
      unitId: requisition.originId,
      unitName: locations.find((item) => item.id === requisition.originId)?.name ?? requisition.originId,
      priority: requisition.priority,
      productId: line.productId,
      productName: product?.name ?? line.productId,
      kfaCode: product?.kfaCode ?? line.productId,
      category: product?.category || 'Lainnya',
      uom: product?.uom || 'unit',
      requested,
      approved,
      issued,
      gap,
      fillRate,
      availableStock,
      fulfillmentStatus,
      requisitionStatus: requisition.status,
      createdAt: requisition.createdAt,
      href: `/requisitions/${encodeURIComponent(requisition.id)}`,
    };
  }));

  const filterOptions = {
    units: [...new Map(baseRows.map((row) => [row.unitId, { value: row.unitId, label: row.unitName }])).values()],
    categories: [...new Set(baseRows.map((row) => row.category))].sort(),
  };
  const rows = baseRows.filter((row) => {
    if (selectedUnit !== 'ALL' && row.unitId !== selectedUnit) return false;
    if (selectedCategory !== 'ALL' && row.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && row.priority !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && row.fulfillmentStatus !== selectedStatus) return false;
    if (selectedThreshold === 'UNDER_80' && row.fillRate >= 80) return false;
    if (selectedThreshold === '80_95' && (row.fillRate < 80 || row.fillRate > 95)) return false;
    if (selectedThreshold === 'OVER_95' && row.fillRate < 95) return false;
    return true;
  });

  const requestedUnits = sum(rows.map((row) => row.requested));
  const approvedUnits = sum(rows.map((row) => row.approved));
  const issuedUnits = sum(rows.map((row) => row.issued));
  const orderGroups = new Map<string, typeof rows>();
  for (const row of rows) orderGroups.set(row.requisitionId, [...(orderGroups.get(row.requisitionId) ?? []), row]);
  const groupedOrders = [...orderGroups.values()];
  const completeOrders = groupedOrders.filter((items) => items.length > 0 && items.every((item) => item.issued >= item.requested)).length;
  const partialOrders = groupedOrders.filter((items) => items.some((item) => item.issued > 0) && !items.every((item) => item.issued >= item.requested)).length;
  const urgentAtRisk = groupedOrders.filter((items) => items[0]?.priority === 'URGENT' && items.some((item) => item.gap > 0)).length;
  const metrics = {
    overallFillRate: requestedUnits > 0 ? issuedUnits / requestedUnits * 100 : 0,
    requestedUnits, approvedUnits, issuedUnits,
    completeOrderRate: groupedOrders.length > 0 ? completeOrders / groupedOrders.length * 100 : 0,
    completeOrders, partialOrders, totalOrders: groupedOrders.length,
    unfulfilledUnits: Math.max(requestedUnits - issuedUnits, 0), urgentAtRisk,
  };

  const daySlots = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index)));
    const dayRows = rows.filter((row) => dateKey(new Date(row.createdAt)) === dateKey(date));
    const requested = sum(dayRows.map((row) => row.requested));
    const approved = sum(dayRows.map((row) => row.approved));
    const issued = sum(dayRows.map((row) => row.issued));
    return { label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date), requested, approved, issued, fillRate: requested > 0 ? issued / requested * 100 : 0 };
  });

  const aggregate = <T extends string>(key: (row: typeof rows[number]) => T, label: (key: T) => string) => {
    const groups = new Map<T, { requested: number; issued: number }>();
    for (const row of rows) { const groupKey = key(row); const entry = groups.get(groupKey) ?? { requested: 0, issued: 0 }; entry.requested += row.requested; entry.issued += row.issued; groups.set(groupKey, entry); }
    return [...groups.entries()].map(([groupKey, value]) => ({ label: label(groupKey), requested: value.requested, issued: value.issued, gap: Math.max(value.requested - value.issued, 0), fillRate: value.requested > 0 ? value.issued / value.requested * 100 : 0 }));
  };
  const unitRanking = aggregate((row) => row.unitId, (key) => locations.find((item) => item.id === key)?.name ?? key)
    .map((item) => ({
      unitId: rows.find((row) => row.unitName === item.label)?.unitId ?? item.label,
      unitName: item.label,
      requested: item.requested,
      issued: item.issued,
      gap: item.gap,
      fillRate: item.fillRate,
    }))
    .sort((a, b) => b.fillRate - a.fillRate);
  const categoryPerformance = aggregate((row) => row.category, (key) => key).map((item) => ({ category: item.label, requested: item.requested, issued: item.issued, gap: item.gap, fillRate: item.fillRate })).sort((a, b) => b.requested - a.requested).slice(0, 6);

  const criticalGaps = [...rows].filter((row) => row.gap > 0).sort((left, right) => (right.priority === 'URGENT' ? 1 : 0) - (left.priority === 'URGENT' ? 1 : 0) || right.gap - left.gap).slice(0, 5).map((row) => {
    const needsReorder = row.availableStock < row.gap;
    const config = needsReorder ? { actionLabel: 'Reorder', href: '/inventory/reorder', tone: 'danger' as const } : row.requisitionStatus === 'SUBMITTED' ? { actionLabel: 'Proses', href: row.href, tone: 'warning' as const } : row.requisitionStatus === 'APPROVED' ? { actionLabel: 'Picking', href: row.href, tone: 'info' as const } : { actionLabel: 'Alokasi', href: row.href, tone: 'purple' as const };
    return { id: row.id, title: `${row.requestNumber} · ${row.productName}`, description: `Req ${row.requested} | Issued ${row.issued} | Gap ${row.gap} ${row.uom}`, ...config };
  });
  const statusCounts = { COMPLETE: rows.filter((row) => row.fulfillmentStatus === 'COMPLETE').length, PARTIAL: rows.filter((row) => row.fulfillmentStatus === 'PARTIAL').length, STOCKOUT: rows.filter((row) => row.fulfillmentStatus === 'STOCKOUT').length, PENDING: rows.filter((row) => row.fulfillmentStatus === 'PENDING').length };

  return NextResponse.json({ locationId, locationName: location.name, target: 90, metrics, trend: daySlots, unitRanking, categoryPerformance, criticalGaps, details: [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20), statusCounts, filterOptions });
}

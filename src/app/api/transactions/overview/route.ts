import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';
import { listReceipts } from '@/api/_fixtures/inbound';
import { listMovements } from '@/api/_fixtures/outbound';
import { listTransfers } from '@/api/_fixtures/transfers';
import { listRequisitions } from '@/api/_fixtures/requisitions';
import { listCycleCounts } from '@/api/_fixtures/cycleCounts';

type TxType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';
type StatusGroup = 'COMPLETED' | 'IN_PROGRESS' | 'DISPATCHED';

interface TxDocument {
  id: string;
  reference: string;
  secondaryReference?: string;
  type: TxType;
  typeLabel: string;
  status: string;
  statusGroup: StatusGroup;
  origin: string;
  destination: string;
  productSummary: string;
  lotSummary: string;
  quantity: number;
  postedQuantity: number;
  createdAt: string;
  pic: string;
  href: string;
  actionRequired: boolean;
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sum(items: number[]) {
  return items.reduce((total, value) => total + safeNumber(value), 0);
}

function statusGroup(status: string, completed: string[], dispatched: string[] = []): StatusGroup {
  if (completed.includes(status)) return 'COMPLETED';
  if (dispatched.includes(status)) return 'DISPATCHED';
  return 'IN_PROGRESS';
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const locationId = search.get('locationId');
  const period = search.get('period') ?? '30D';
  const type = search.get('type') ?? 'ALL';
  const selectedStatus = search.get('status') ?? 'ALL';
  if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });

  const { locations, products } = getDb();
  const location = locations.find((item) => item.id === locationId);
  if (!location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  const locationName = (id?: string) => locations.find((item) => item.id === id)?.name ?? id ?? '-';
  const productName = (id: string) => products.find((item) => item.id === id || item.kfaCode === id)?.name ?? id;
  const productSummary = (ids: string[]) => {
    const names = [...new Set(ids.map(productName))];
    return names.length > 1 ? `${names[0]} +${names.length - 1} produk` : names[0] ?? '-';
  };
  const now = new Date();

  const receiptDocuments: TxDocument[] = listReceipts()
    .filter((item) => item.destinationLocationId === locationId)
    .map((item) => ({
      id: `receipt-${item.id}`,
      reference: item.receiptNumber,
      secondaryReference: item.referenceId,
      type: 'INBOUND',
      typeLabel: 'Inbound Receipt',
      status: item.status,
      statusGroup: statusGroup(item.status, ['COMPLETED']),
      origin: item.sourceType === 'SUPPLIER' ? 'Supplier' : item.sourceType,
      destination: location.name,
      productSummary: productSummary(item.items.map((line) => line.productId)),
      lotSummary: item.items.map((line) => line.lot).filter(Boolean).join(', ') || 'Lot belum dicatat',
      quantity: sum(item.items.map((line) => safeNumber(line.qtyExpected))),
      postedQuantity: item.status === 'COMPLETED' ? sum(item.items.map((line) => safeNumber(line.qtyReceived ?? line.qtyExpected))) : sum(item.items.map((line) => safeNumber(line.qtyReceived))),
      createdAt: item.createdAt ?? item.receivedAt ?? now.toISOString(),
      pic: item.receivedBy ?? 'Tim Inbound',
      href: `/inbound?id=${encodeURIComponent(item.id)}`,
      actionRequired: item.status !== 'COMPLETED',
    }));

  const movementDocuments: TxDocument[] = listMovements()
    .filter((item) => item.originId === locationId || item.destinationId === locationId)
    .map((item) => ({
      id: `movement-${item.id}`,
      reference: item.movementNumber,
      type: 'OUTBOUND',
      typeLabel: 'Outbound Shipment',
      status: item.status,
      statusGroup: statusGroup(item.status, ['RECEIVED'], ['DISPATCHED']),
      origin: locationName(item.originId),
      destination: locationName(item.destinationId),
      productSummary: productSummary(item.items.map((line) => line.productId)),
      lotSummary: item.items.map((line) => line.lot).filter(Boolean).join(', ') || 'FEFO saat picking',
      quantity: sum(item.items.map((line) => safeNumber(line.qty))),
      postedQuantity: ['DISPATCHED', 'RECEIVED'].includes(item.status) ? sum(item.items.map((line) => safeNumber(line.qty))) : 0,
      createdAt: item.createdAt,
      pic: 'Tim Outbound',
      href: '/outbound',
      actionRequired: item.status !== 'RECEIVED',
    }));

  const requisitionDocuments: TxDocument[] = listRequisitions()
    .filter((item) => item.originId === locationId || item.destinationId === locationId)
    .map((item) => ({
      id: `requisition-${item.id}`,
      reference: item.requestNumber,
      type: 'OUTBOUND',
      typeLabel: 'Requisition Unit',
      status: item.status,
      statusGroup: statusGroup(item.status, ['RECEIVED'], ['ISSUED']),
      origin: locationName(item.destinationId),
      destination: locationName(item.originId),
      productSummary: productSummary(item.items.map((line) => line.productId)),
      lotSummary: `${item.items.length} item permintaan`,
      quantity: sum(item.items.map((line) => safeNumber(line.qtyRequested))),
      postedQuantity: sum(item.items.map((line) => safeNumber(line.qtyIssued))),
      createdAt: item.createdAt,
      pic: item.requestedBy || 'Pemohon Unit',
      href: `/requisitions/${encodeURIComponent(item.id)}`,
      actionRequired: ['SUBMITTED', 'APPROVED', 'PICKING'].includes(item.status),
    }));

  const transferDocuments: TxDocument[] = listTransfers()
    .filter((item) => item.originId === locationId || item.destinationId === locationId)
    .map((item) => ({
      id: `transfer-${item.id}`,
      reference: item.transferNumber,
      type: 'TRANSFER',
      typeLabel: 'Transfer Gudang',
      status: item.status,
      statusGroup: statusGroup(item.status, ['COMPLETED']),
      origin: locationName(item.originId),
      destination: locationName(item.destinationId),
      productSummary: productSummary(item.items.map((line) => line.productId)),
      lotSummary: item.items.map((line) => line.lot).filter(Boolean).join(', ') || 'Lot belum dipilih',
      quantity: sum(item.items.map((line) => safeNumber(line.qty))),
      postedQuantity: item.status === 'COMPLETED' ? sum(item.items.map((line) => safeNumber(line.qty))) : 0,
      createdAt: item.createdAt,
      pic: 'Tim Transfer',
      href: '/transfers',
      actionRequired: item.status !== 'COMPLETED',
    }));

  const adjustmentDocuments: TxDocument[] = listCycleCounts({ locationId }).map((item) => ({
    id: `adjustment-${item.id}`,
    reference: item.countNumber,
    type: 'ADJUSTMENT',
    typeLabel: 'Stock Opname',
    status: item.status,
    statusGroup: statusGroup(item.status, ['COMPLETED']),
    origin: location.name,
    destination: location.name,
    productSummary: `${item.items.length} item dihitung`,
    lotSummary: `${item.items.filter((line) => safeNumber(line.variance) !== 0).length} variance`,
    quantity: sum(item.items.map((line) => Math.abs(safeNumber(line.variance)))),
    postedQuantity: item.status === 'COMPLETED' ? sum(item.items.map((line) => Math.abs(safeNumber(line.variance)))) : 0,
    createdAt: item.createdAt,
    pic: 'Tim Stock Opname',
    href: item.status === 'RESOLVING' ? `/cycle-count/resolve?id=${encodeURIComponent(item.id)}` : '/cycle-count',
    actionRequired: item.status !== 'COMPLETED',
  }));

  const allDocuments = [...receiptDocuments, ...movementDocuments, ...requisitionDocuments, ...transferDocuments, ...adjustmentDocuments];
  const cutoffDays = period === 'TODAY' ? 0 : period === '7D' ? 6 : period === '30D' ? 29 : null;
  const cutoff = cutoffDays === null ? null : startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - cutoffDays));
  const periodDocuments = allDocuments.filter((item) => !cutoff || new Date(item.createdAt) >= cutoff);
  const filtered = periodDocuments
    .filter((item) => type === 'ALL' || item.type === type)
    .filter((item) => {
      if (selectedStatus === 'ALL') return true;
      if (selectedStatus === 'ACTION_REQUIRED') return item.actionRequired;
      return item.statusGroup === selectedStatus;
    });

  const byType = (selectedType: TxType) => filtered.filter((item) => item.type === selectedType);
  const completed = filtered.filter((item) => item.statusGroup === 'COMPLETED');
  const metrics = {
    totalDocuments: filtered.length,
    inboundDocuments: byType('INBOUND').length,
    inboundUnits: sum(byType('INBOUND').map((item) => item.postedQuantity)),
    inboundCompleted: byType('INBOUND').filter((item) => item.statusGroup === 'COMPLETED').length,
    outboundDocuments: byType('OUTBOUND').length,
    outboundUnits: sum(byType('OUTBOUND').map((item) => item.postedQuantity)),
    outboundCompleted: byType('OUTBOUND').filter((item) => item.statusGroup === 'COMPLETED').length,
    workInProgress: filtered.filter((item) => item.statusGroup !== 'COMPLETED').length,
    actionRequired: filtered.filter((item) => item.actionRequired).length,
    completionRate: filtered.length > 0 ? (completed.length / filtered.length) * 100 : 0,
  };

  const types: Array<{ type: TxType; label: string }> = [
    { type: 'OUTBOUND', label: 'Pengiriman & Permintaan Unit' },
    { type: 'INBOUND', label: 'Penerimaan Supplier' },
    { type: 'TRANSFER', label: 'Transfer Antar Gudang' },
    { type: 'ADJUSTMENT', label: 'Adjustment Opname' },
  ];
  const distribution = types.map((entry) => ({ ...entry, value: byType(entry.type).length }));
  const totalsByType = Object.fromEntries(distribution.map((item) => [item.type, item.value])) as Record<TxType, number>;

  const daySlots = Array.from({ length: 7 }, (_, index) => {
    const date = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index)));
    const dayDocuments = filtered.filter((item) => dateKey(new Date(item.createdAt)) === dateKey(date));
    const created = dayDocuments.length;
    const dayCompleted = dayDocuments.filter((item) => item.statusGroup === 'COMPLETED').length;
    return {
      label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date),
      inbound: sum(dayDocuments.filter((item) => item.type === 'INBOUND').map((item) => item.postedQuantity)),
      outbound: sum(dayDocuments.filter((item) => item.type === 'OUTBOUND').map((item) => item.postedQuantity)),
      created,
      completed: dayCompleted,
      completionRate: created > 0 ? (dayCompleted / created) * 100 : 0,
    };
  });

  const pipeline = [
    { key: 'draft', label: 'Draft / Persiapan', value: filtered.filter((item) => ['CREATED', 'DRAFT', 'ITEMS', 'SUBMITTED'].includes(item.status)).length, tone: 'muted' as const },
    { key: 'processing', label: 'Receiving & Picking', value: filtered.filter((item) => ['RECEIVING', 'PICKING', 'PACKED', 'APPROVED', 'IN_PROGRESS', 'RESOLVING'].includes(item.status)).length, tone: 'warning' as const },
    { key: 'transit', label: 'Dispatched / Transit', value: filtered.filter((item) => ['DISPATCHED', 'ISSUED'].includes(item.status)).length, tone: 'info' as const },
    { key: 'completed', label: 'Completed Selesai', value: completed.length, tone: 'success' as const },
  ];

  const criticalActions = filtered.filter((item) => item.actionRequired).slice(0, 5).map((item) => {
    const config = item.type === 'INBOUND'
      ? { actionLabel: 'Selesaikan', tone: 'warning' as const }
      : item.type === 'OUTBOUND' && item.statusGroup === 'DISPATCHED'
        ? { actionLabel: 'Konfirmasi', tone: 'info' as const }
        : item.type === 'OUTBOUND'
          ? { actionLabel: 'Lanjutkan', tone: 'danger' as const }
          : item.type === 'TRANSFER'
            ? { actionLabel: 'Review', tone: 'purple' as const }
            : { actionLabel: 'Investigasi', tone: 'warning' as const };
    return {
      id: item.id,
      title: `${item.reference} · ${item.typeLabel}`,
      description: `${item.productSummary} · ${item.quantity} unit · ${item.status}`,
      href: item.href,
      ...config,
    };
  });

  return NextResponse.json({
    locationId,
    locationName: location.name,
    metrics,
    distribution,
    flowTrend: daySlots.map(({ label, inbound, outbound }) => ({ label, inbound, outbound })),
    throughputTrend: daySlots.map(({ label, created, completed: dayCompleted, completionRate }) => ({ label, created, completed: dayCompleted, completionRate })),
    pipeline,
    criticalActions,
    recentTransactions: [...filtered].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()).slice(0, 12),
    totalsByType,
  });
}

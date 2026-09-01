import { NextResponse } from 'next/server';
import { listMovements } from '@/api/_fixtures/outbound';
import { listPOs } from '@/api/_fixtures/procurement';
import { listRequisitions } from '@/api/_fixtures/requisitions';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function GET() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const monthlyFillRate = months.map((month, idx) => ({
    month,
    qtyLeft: Math.floor(400 + Math.sin(idx) * 50 + idx * 10),
    fillRatePercent: Number((94 + (idx % 4) * 1.5).toFixed(1)),
  }));

  const monthlyStockout = months.map((month, idx) => ({
    month,
    stockoutCount: Math.floor(Math.abs(Math.cos(idx) * 4) + (idx % 3)),
  }));

  const categoryBreakdown = [
    { category: 'Analgesik & Antipiretik', quantity: 4500, value: 67500000 },
    { category: 'Antibiotik & Antimikroba', quantity: 2800, value: 140000000 },
    { category: 'Kardiovaskular', quantity: 1900, value: 95000000 },
    { category: 'Gastrointestinal', quantity: 3100, value: 46500000 },
    { category: 'Cairan Infus & Elektrolit', quantity: 6200, value: 124000000 },
    { category: 'Vitamin & Suplemen', quantity: 1500, value: 22500000 },
  ];

  const fastMovers = [
    { name: 'Paracetamol Infus 10mg/ml', totalQty: 4200 },
    { name: 'NaCl 0.9% 500ml', totalQty: 3800 },
    { name: 'Ceftriaxone Inj 1g', totalQty: 2900 },
    { name: 'Omeprazole Inj 40mg', totalQty: 2400 },
    { name: 'Amlodipine 10mg Tab', totalQty: 2100 },
  ];

  const weeklyFulfillment = [
    { day: 'SEN', requested: 36, approved: 55, issued: 95, received: 48 },
    { day: 'SEL', requested: 76, approved: 109, issued: 84, received: 60 },
    { day: 'RAB', requested: 63, approved: 100, issued: 90, received: 42 },
    { day: 'KAM', requested: 88, approved: 102, issued: 80, received: 55 },
    { day: 'JUM', requested: 49, approved: 70, issued: 90, received: 46 },
    { day: 'SAB', requested: 56, approved: 84, issued: 49, received: 30 },
    { day: 'MIN', requested: 70, approved: 116, issued: 92, received: 63 },
  ];

  const requisitions = listRequisitions().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const movements = listMovements().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const purchaseOrders = listPOs().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const priorityRequisition = requisitions.find((item) => item.priority === 'URGENT') ?? requisitions[0];
  const today = new Date();
  const selectedDate = toDateKey(today);
  const markedDates = [0, 2, 5, 8, 12, 16, 19, 23]
    .map((offset) => toDateKey(addDays(today, offset)))
    .filter((date, index, values) => values.indexOf(date) === index);

  const operationalSchedule = {
    month: selectedDate.slice(0, 7),
    selectedDate,
    markedDates,
    agenda: {
      date: selectedDate,
      startTime: '10:30',
      endTime: '11:00',
      title: priorityRequisition?.requestNumber ?? 'Review kebutuhan unit',
      subtitle: priorityRequisition
        ? `${priorityRequisition.priority} • ${priorityRequisition.items.length} item`
        : 'Sinkronisasi stok operasional',
      status: priorityRequisition?.status ?? 'SCHEDULED',
      href: priorityRequisition ? `/requisitions/${priorityRequisition.id}` : '/requisitions',
    },
  };

  const recentTransactions = requisitions.slice(0, 2).map((requisition) => ({
    id: requisition.id,
    reference: requisition.requestNumber,
    label: requisition.priority === 'URGENT' ? 'Permintaan prioritas' : 'Permintaan rutin',
    quantity: requisition.items.reduce((total, item) => total + item.qtyRequested, 0),
    status: requisition.status,
    occurredAt: requisition.createdAt,
    href: `/requisitions/${requisition.id}`,
  }));

  const recentActivities = [
    ...requisitions.slice(0, 2).map((requisition) => ({
      id: `requisition-${requisition.id}`,
      title: `${requisition.requestNumber} ${requisition.status.toLowerCase()}`,
      occurredAt: requisition.createdAt,
      status: requisition.status,
      tone: requisition.status === 'ISSUED' || requisition.status === 'RECEIVED'
        ? ('success' as const)
        : requisition.priority === 'URGENT'
          ? ('warning' as const)
          : ('info' as const),
      href: `/requisitions/${requisition.id}`,
    })),
    ...movements.slice(0, 1).map((movement) => ({
      id: `movement-${movement.id}`,
      title: `${movement.movementNumber} sedang ${movement.status.toLowerCase()}`,
      occurredAt: movement.createdAt,
      status: movement.status,
      tone: 'info' as const,
      href: '/outbound',
    })),
    ...purchaseOrders.slice(0, 1).map((purchaseOrder) => ({
      id: `purchase-${purchaseOrder.id}`,
      title: `${purchaseOrder.poNumber} • ${purchaseOrder.supplierName}`,
      occurredAt: purchaseOrder.createdAt,
      status: purchaseOrder.status,
      tone: purchaseOrder.status === 'RECEIVED' ? ('success' as const) : ('warning' as const),
      href: `/procurement/${purchaseOrder.id}`,
    })),
  ].slice(0, 3);

  const inventoryStatusSummary = {
    belowMinimum: 8,
    belowReorder: 14,
    healthy: 112,
    overstocked: 16,
    totalStockedSkus: 150,
    statusBars: [
      { status: 'BELOW_MIN' as const, label: 'Di Bawah Minimum', count: 8, percentage: 5.3, color: '#ef4444', href: '/inventory?status=STOCKOUT' },
      { status: 'BELOW_REORDER' as const, label: 'Di Bawah Reorder Level', count: 14, percentage: 9.3, color: '#f59e0b', href: '/inventory/reorder' },
      { status: 'HEALTHY' as const, label: 'Stok Sehat (Optimal)', count: 112, percentage: 74.7, color: '#52b788', href: '/inventory?status=ACTIVE' },
      { status: 'OVERSTOCKED' as const, label: 'Stok Berlebih (Overstock)', count: 16, percentage: 10.7, color: '#60a5fa', href: '/inventory' },
    ],
    categoryDistribution: [
      { category: 'Analgesik & Antipiretik', belowMin: 2, belowReorder: 3, healthy: 28, overstocked: 4, total: 37 },
      { category: 'Antibiotik & Antimikroba', belowMin: 3, belowReorder: 4, healthy: 22, overstocked: 2, total: 31 },
      { category: 'Kardiovaskular', belowMin: 1, belowReorder: 2, healthy: 19, overstocked: 3, total: 25 },
      { category: 'Gastrointestinal', belowMin: 1, belowReorder: 2, healthy: 18, overstocked: 3, total: 24 },
      { category: 'Cairan Infus & Elektrolit', belowMin: 1, belowReorder: 2, healthy: 15, overstocked: 3, total: 21 },
      { category: 'Vitamin & Suplemen', belowMin: 0, belowReorder: 1, healthy: 10, overstocked: 1, total: 12 },
    ],
  };

  const expirationSummary = {
    expiring30Days: { count: 3, qty: 340, value: 8400000 },
    expiring60Days: { count: 5, qty: 720, value: 19500000 },
    expiring90Days: { count: 8, qty: 1250, value: 32100000 },
    expiring180Days: { count: 14, qty: 2800, value: 74000000 },
    healthyMore180Days: { count: 52, qty: 9400, value: 245000000 },
    timeline: [
      { period: 'past', label: 'Kedaluwarsa', quantity: 15, lotsCount: 1, valueEst: 450000, color: '#dc2626' },
      { period: '30d', label: '< 30 Hari', quantity: 340, lotsCount: 3, valueEst: 8400000, color: '#ef4444' },
      { period: '60d', label: '31–60 Hari', quantity: 720, lotsCount: 5, valueEst: 19500000, color: '#f97316' },
      { period: '90d', label: '61–90 Hari', quantity: 1250, lotsCount: 8, valueEst: 32100000, color: '#f59e0b' },
      { period: '180d', label: '91–180 Hari', quantity: 2800, lotsCount: 14, valueEst: 74000000, color: '#84cc16' },
      { period: '365d', label: '> 180 Hari', quantity: 9400, lotsCount: 52, valueEst: 245000000, color: '#2d6a4f' },
    ],
    criticalBatches: [
      { id: 'batch-1', productName: 'Paracetamol 500 mg Tablet', kfaCode: '93000462', lotNumber: 'LOT-2026-105', expiryDate: '2026-09-20', daysRemaining: 19, quantity: 40, uom: 'Box', bin: 'Z-A1', location: 'Gudang Farmasi Pusat', status: 'CRITICAL' as const },
      { id: 'batch-2', productName: 'Cefixime Sirup 100mg/5ml', kfaCode: '93008292', lotNumber: 'LOT-2026-030', expiryDate: '2026-09-26', daysRemaining: 25, quantity: 30, uom: 'Botol', bin: 'Z-B3', location: 'Gudang Farmasi Pusat', status: 'CRITICAL' as const },
      { id: 'batch-3', productName: 'Amoxicillin 500 mg Tablet', kfaCode: '93012826', lotNumber: 'LOT-2026-010', expiryDate: '2026-10-28', daysRemaining: 57, quantity: 18, uom: 'Box', bin: 'Z-B2', location: 'Gudang Farmasi Pusat', status: 'WARNING' as const },
      { id: 'batch-4', productName: 'Omeprazole 20 mg Kapsul', kfaCode: '93025130', lotNumber: 'LOT-2026-088', expiryDate: '2026-11-15', daysRemaining: 75, quantity: 60, uom: 'Box', bin: 'Z-C1', location: 'Gudang Farmasi Pusat', status: 'ATTENTION' as const },
    ],
  };

  const stockMovements = {
    outgoingInProgress: [
      { id: 'mov-1', movementNumber: 'OUT-2026-5002', reference: 'REQ-2026-URG-1002', origin: 'Gudang Farmasi Pusat', destination: 'Depo IGD', itemsCount: 1, totalQuantity: 40, priority: 'URGENT' as const, status: 'APPROVED' as const, requestedAt: '2026-09-01T08:30:00.000Z', requiredDate: '2026-09-01T12:00:00.000Z', href: '/requisitions/REQ-002' },
      { id: 'mov-2', movementNumber: 'OUT-2026-5001', reference: 'REQ-2026-RQ-1001', origin: 'Gudang Farmasi Pusat', destination: 'Depo Rawat Inap', itemsCount: 2, totalQuantity: 30, priority: 'RUTIN' as const, status: 'PICKING' as const, requestedAt: '2026-09-01T07:15:00.000Z', requiredDate: '2026-09-02T10:00:00.000Z', href: '/outbound' },
      { id: 'mov-3', movementNumber: 'OUT-2026-5003', reference: 'REQ-2026-RQ-1004', origin: 'Gudang Farmasi Pusat', destination: 'Depo Kamar Bedah (OK)', itemsCount: 4, totalQuantity: 75, priority: 'RUTIN' as const, status: 'SUBMITTED' as const, requestedAt: '2026-09-01T09:45:00.000Z', requiredDate: '2026-09-02T14:00:00.000Z', href: '/requisitions' },
      { id: 'mov-4', movementNumber: 'OUT-2026-4998', reference: 'REQ-2026-RQ-0995', origin: 'Gudang Farmasi Pusat', destination: 'Apotek Rawat Jalan', itemsCount: 3, totalQuantity: 90, priority: 'NORMAL' as const, status: 'ISSUED' as const, requestedAt: '2026-08-31T14:20:00.000Z', requiredDate: '2026-09-01T09:00:00.000Z', href: '/outbound' },
    ],
    delayedIncoming: [
      { id: 'delay-1', poNumber: 'PO-2026-11002', supplierName: 'PT Kimia Farma Trading & Distribution', destination: 'Gudang Farmasi Pusat', expectedDeliveryDate: '2026-08-29', daysDelayed: 3, itemsCount: 3, totalQuantity: 450, totalValue: 28500000, status: 'CRITICAL_OVERDUE' as const, contact: 'Budi Santoso (0812-3456-7890)', href: '/procurement/PO-11002' },
      { id: 'delay-2', poNumber: 'PO-2026-11005', supplierName: 'PT Kalbe Farma Tbk', destination: 'Gudang Farmasi Pusat', expectedDeliveryDate: '2026-08-31', daysDelayed: 1, itemsCount: 2, totalQuantity: 200, totalValue: 41200000, status: 'DELAYED' as const, contact: 'Siti Rahma (0813-8899-1122)', href: '/procurement/PO-11005' },
      { id: 'delay-3', poNumber: 'PO-2026-11008', supplierName: 'PT Mensa Bina Sukses', destination: 'Gudang Farmasi Pusat', expectedDeliveryDate: '2026-09-03', daysDelayed: 0, itemsCount: 5, totalQuantity: 620, totalValue: 19800000, status: 'PARTIAL_PENDING' as const, contact: 'Hendra Wijaya (0811-2233-4455)', href: '/procurement/PO-11008' },
    ],
    discrepancies: [
      { id: 'disc-1', receiptNumber: 'IN-2026-3012', poNumber: 'PO-2026-10992', supplierName: 'PT Kimia Farma Trading', productName: 'Paracetamol 500 mg Tablet', kfaCode: '93000462', lotNumber: 'LOT-KF-8821', qtyExpected: 100, qtyReceived: 85, variance: -15, variancePercent: -15.0, reason: '15 box karton penyok dan basah saat transit ekspedisi', status: 'PENDING_REVIEW' as const, recordedAt: '2026-09-01T08:10:00.000Z', recordedBy: 'Apt. Rian, S.Farm', href: '/inbound' },
      { id: 'disc-2', receiptNumber: 'IN-2026-3015', poNumber: 'PO-2026-10998', supplierName: 'PT Dexa Medica', productName: 'Ceftriaxone 1g Injeksi', kfaCode: '93012826', lotNumber: 'LOT-DX-4410', qtyExpected: 50, qtyReceived: 46, variance: -4, variancePercent: -8.0, reason: 'Koli kurang 4 vial saat unboxing serah terima faktur', status: 'INVESTIGATING' as const, recordedAt: '2026-08-31T15:30:00.000Z', recordedBy: 'Nurul H., A.Md.Farm', href: '/inbound' },
      { id: 'disc-3', receiptNumber: 'IN-2026-3018', poNumber: 'PO-2026-11001', supplierName: 'PT Sanbe Farma', productName: 'Cefixime Sirup 100mg/5ml', kfaCode: '93008292', lotNumber: 'LOT-SB-1109', qtyExpected: 60, qtyReceived: 60, variance: 0, variancePercent: 0, reason: 'Suhu data-logger pendingin mencatat 28.4°C (>25°C). Karantina audit mutu.', status: 'PENDING_REVIEW' as const, recordedAt: '2026-08-31T11:00:00.000Z', recordedBy: 'Dimas A., S.Farm', href: '/inbound' },
    ],
  };

  return NextResponse.json({
    monthlyFillRate,
    monthlyStockout,
    categoryBreakdown,
    fastMovers,
    weeklyFulfillment,
    operationalSchedule,
    recentTransactions,
    recentActivities,
    inventoryStatusSummary,
    expirationSummary,
    stockMovements,
  });
}

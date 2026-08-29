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

  return NextResponse.json({
    monthlyFillRate,
    monthlyStockout,
    categoryBreakdown,
    fastMovers,
    weeklyFulfillment,
    operationalSchedule,
    recentTransactions,
    recentActivities,
  });
}

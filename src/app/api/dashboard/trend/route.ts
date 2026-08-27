import { NextResponse } from 'next/server';

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

  return NextResponse.json({
    monthlyFillRate,
    monthlyStockout,
    categoryBreakdown,
    fastMovers,
  });
}

import { NextResponse } from 'next/server';
import { getDb } from '@/api/_fixtures/store';

export async function GET() {
  const { products } = getDb();

  const totalProducts = products.length;

  return NextResponse.json({
    totalProducts,
    lowStockCount: 5,
    stockoutCount: 2,
    expiring30DaysCount: 4,
    pendingRequisitionsCount: 7,
    fillRatePercentage: 97.4,
  });
}

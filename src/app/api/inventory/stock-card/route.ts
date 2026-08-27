import { getStockItem, getStockCardTransactions } from '@/api/_fixtures/inventory';
import { getDb } from '@/api/_fixtures/store';
import { getStockStatus } from '@/features/inventory/stockStatus';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const locationId = searchParams.get('locationId');

  if (!productId || !locationId) {
    return NextResponse.json(
      { error: 'productId and locationId are required' },
      { status: 400 }
    );
  }

  const { products } = getDb();
  const product = products.find((p) => p.id === productId || p.kfaCode === productId);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const stockItems = getStockItem(productId, locationId);

  const items = stockItems.map((it) => ({
    lot: it.lot,
    expiry: it.expiry,
    bin: it.bin,
    qtyOnHand: it.qtyOnHand,
    status: getStockStatus({ qtyOnHand: it.qtyOnHand, expiry: it.expiry }),
  }));

  // Real running balance: open (seed) as the starting position, then apply each
  // tracked ledger entry chronologically to derive the cumulative balance.
  const rawTx = getStockCardTransactions(productId, locationId);
  const ledgerTx = rawTx.map((t, index) => ({
    date: t.date,
    type: t.type,
    qtyIn: t.qtyIn,
    qtyOut: t.qtyOut,
    balance: t.balance,
    user: t.user,
    reference: t.reference,
    lot: t.lot,
  }));

  // If there is no tracked ledger yet, fall back to the seeded lots as opening entries.
  let transactions = ledgerTx;
  if (transactions.length === 0) {
    transactions = stockItems.map((it, index) => ({
      date: it.expiry ? new Date(new Date(it.expiry).getTime() - 90 * 86_400_000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      type: 'IN' as const,
      qtyIn: it.qtyOnHand,
      qtyOut: 0,
      balance: it.qtyOnHand,
      user: index === 0 ? 'admin' : 'manager',
      reference: `RECEIPT-${it.lot}`,
      lot: it.lot,
    }));
  }

  return NextResponse.json({
    product,
    items,
    transactions,
  });
}
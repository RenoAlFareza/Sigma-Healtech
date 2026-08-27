import { getProductById, updateProduct } from '@/api/_fixtures/store';
import type { Product } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;

  let body: Partial<Product>;
  try {
    body = (await request.json()) as Partial<Product>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updated = updateProduct(id, body);

  if (!updated) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
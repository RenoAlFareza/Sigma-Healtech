import { addProduct, searchProducts } from '@/api/_fixtures/store';
import type { Product } from '@/shared/types/domain';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || undefined;
  const category = searchParams.get('category') || undefined;
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const sizeParam = parseInt(searchParams.get('size') || '20', 10);

  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const size = isNaN(sizeParam) || sizeParam < 1 ? 20 : sizeParam;

  const filteredProducts = searchProducts(keyword, category);
  const totalCount = filteredProducts.length;

  const startIndex = (page - 1) * size;
  const paginatedData = filteredProducts.slice(startIndex, startIndex + size);

  return NextResponse.json({
    data: paginatedData,
    totalCount,
  });
}

export async function POST(request: Request) {
  let body: Partial<Product>;
  try {
    body = (await request.json()) as Partial<Product>;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Assign an id when missing, falling back to the kfaCode.
  const id = body.id || body.kfaCode;
  if (!id) {
    return NextResponse.json(
      { error: 'Product requires an id or kfaCode' },
      { status: 400 }
    );
  }

  const created = addProduct({ ...body, id } as Product);
  return NextResponse.json(created, { status: 201 });
}
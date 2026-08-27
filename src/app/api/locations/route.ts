import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

export async function GET() {
  const { locations } = getDb();
  return NextResponse.json({
    data: locations,
    totalCount: locations.length,
  });
}

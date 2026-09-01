import { computeReport } from '@/shared/lib/reportAggregates';
import type { ReportType } from '@/shared/lib/reportAggregates';
import { getDb } from '@/api/_fixtures/store';
import { NextResponse } from 'next/server';

const VALID_TYPES: ReportType[] = ['expiry', 'stockout', 'summary', 'audit', 'transactions'];

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  // Reports expose sensitive data (expiry/stockout/transaction audit) — require
  // an authenticated, non-disabled user. All active roles may read reports.
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized: missing x-user-id header' }, { status: 401 });
  }
  const { users } = getDb();
  const actor = users.find((u) => u.id === userId || u.username === userId);
  if (!actor || !actor.active) {
    return NextResponse.json({ error: 'Unauthorized: invalid user' }, { status: 401 });
  }

  const { type } = await params;
  if (!VALID_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') || undefined;
  const daysParam = searchParams.get('days');
  const days = daysParam ? parseInt(daysParam, 10) : undefined;

  const data = computeReport(type as ReportType, {
    locationId,
    days: days && !isNaN(days) ? days : undefined,
  });
  return NextResponse.json(data);
}
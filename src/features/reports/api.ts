import { apiFetch } from '@/api';
import type { ReportData, ReportType, ReportParams } from './compute';

export type { ReportType, ReportData } from './compute';

export async function getReport(type: ReportType, params: ReportParams = {}): Promise<ReportData> {
  const sp = new URLSearchParams();
  if (params.locationId && params.locationId !== 'ALL') sp.set('locationId', params.locationId);
  if (params.days) sp.set('days', String(params.days));
  if (params.keyword) sp.set('keyword', params.keyword);
  const qs = sp.toString();
  return apiFetch<ReportData>(`/reports/${type}${qs ? `?${qs}` : ''}`);
}
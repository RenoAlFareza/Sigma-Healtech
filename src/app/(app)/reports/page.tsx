import type { Metadata } from 'next';
import { ReportsHub } from '@/features/reports/ReportsHub';
import type { ReportType } from '@/features/reports/api';

export const metadata: Metadata = {
  title: 'Reports — SIGMA',
  description: 'Expiry, stockout, summary, and transaction reports.',
};

const REPORT_TYPES: ReportType[] = ['summary', 'expiry', 'stockout', 'transactions'];

export default async function ReportsPage({ searchParams }: PageProps<'/reports'>) {
  const requestedType = (await searchParams).type;
  const initialType = typeof requestedType === 'string' && REPORT_TYPES.includes(requestedType as ReportType)
    ? requestedType as ReportType
    : 'summary';

  return (
    <div className="w-full">
      <ReportsHub key={initialType} initialType={initialType} />
    </div>
  );
}

import type { Metadata } from 'next';
import { CycleCountReport } from '@/features/cycle-count/CycleCountReport';

export const metadata: Metadata = {
  title: 'Cycle Count Report — SIGMA',
  description: 'Cycle count accuracy report.',
};

export default async function CycleCountReportPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="p-6">
      <CycleCountReport id={id || ''} />
    </div>
  );
}
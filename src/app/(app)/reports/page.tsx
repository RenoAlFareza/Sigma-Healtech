import type { Metadata } from 'next';
import { ReportsHub } from '@/features/reports/ReportsHub';

export const metadata: Metadata = {
  title: 'Reports — SIGMA',
  description: 'Expiry, stockout, summary, and transaction reports.',
};

export default function ReportsPage() {
  return (
    <div className="p-6">
      <ReportsHub />
    </div>
  );
}
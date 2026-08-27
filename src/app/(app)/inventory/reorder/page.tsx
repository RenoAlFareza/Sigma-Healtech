import type { Metadata } from 'next';
import { ReorderReport } from '@/features/inventory/ReorderReport';

export const metadata: Metadata = {
  title: 'Reorder Report — SIGMA',
  description: 'Items that need reordering.',
};

export default function ReorderReportPage() {
  return (
    <div className="p-6">
      <ReorderReport />
    </div>
  );
}
import type { Metadata } from 'next';
import { RequisitionList } from '@/features/requisitions/RequisitionList';

export const metadata: Metadata = {
  title: 'Requisitions — SIGMA',
  description: 'Stock requisition requests.',
};

export default function RequisitionsPage() {
  return (
    <div className="p-6">
      <RequisitionList />
    </div>
  );
}
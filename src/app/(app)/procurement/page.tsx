import type { Metadata } from 'next';
import { ProcurementList } from '@/features/procurement/ProcurementList';

export const metadata: Metadata = {
  title: 'Procurement — SIGMA',
  description: 'Purchase orders list.',
};

export default function ProcurementPage() {
  return (
    <div className="w-full">
      <ProcurementList />
    </div>
  );
}

import type { Metadata } from 'next';
import { RequisitionCreate } from '@/features/requisitions/RequisitionCreate';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Create Requisition — SIGMA',
  description: 'Create a stock requisition.',
};

export default function CreateRequisitionPage() {
  return (
    <div className="p-6">
      <ToastProvider>
        <RequisitionCreate />
      </ToastProvider>
    </div>
  );
}
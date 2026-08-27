import type { Metadata } from 'next';
import { ProcurementCreate } from '@/features/procurement/ProcurementCreate';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'New PO — SIGMA',
  description: 'Create a purchase order.',
};

export default function NewPOPage() {
  return (
    <div className="p-6">
      <ToastProvider>
        <ProcurementCreate />
      </ToastProvider>
    </div>
  );
}
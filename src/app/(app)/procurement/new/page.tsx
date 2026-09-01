import type { Metadata } from 'next';
import { ProcurementCreate } from '@/features/procurement/ProcurementCreate';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'New PO — SIGMA',
  description: 'Create a purchase order.',
};

export default function NewPOPage() {
  return (
    <div className="w-full">
      <ToastProvider>
        <ProcurementCreate />
      </ToastProvider>
    </div>
  );
}

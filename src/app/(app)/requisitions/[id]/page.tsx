import type { Metadata } from 'next';
import { RequisitionDetail } from '@/features/requisitions/RequisitionDetail';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Requisition Detail — SIGMA',
  description: 'Review, pick, and issue a requisition.',
};

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <ToastProvider>
        <RequisitionDetail id={id} />
      </ToastProvider>
    </div>
  );
}
import type { Metadata } from 'next';
import { ProcurementDetail } from '@/features/procurement/ProcurementDetail';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'PO Detail — SIGMA',
  description: 'Purchase order detail and receiving.',
};

export default async function POMDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="w-full">
      <ToastProvider>
        <ProcurementDetail id={id} />
      </ToastProvider>
    </div>
  );
}

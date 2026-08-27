import type { Metadata } from 'next';
import { Putaway } from '@/features/inbound/Putaway';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Putaway — SIGMA',
  description: 'Assign bins for received goods.',
};

export default async function PutawayPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="p-6">
      <ToastProvider>
        <Putaway id={id || ''} />
      </ToastProvider>
    </div>
  );
}
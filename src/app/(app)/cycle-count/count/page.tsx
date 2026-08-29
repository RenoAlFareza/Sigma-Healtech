import type { Metadata } from 'next';
import { CycleCountCount } from '@/features/cycle-count/CycleCountCount';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Cycle Count Count — SIGMA',
  description: 'Enter counted quantities.',
};

export default async function CycleCountCountPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="w-full">
      <ToastProvider>
        <CycleCountCount id={id || ''} />
      </ToastProvider>
    </div>
  );
}

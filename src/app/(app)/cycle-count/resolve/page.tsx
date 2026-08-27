import type { Metadata } from 'next';
import { CycleCountResolve } from '@/features/cycle-count/CycleCountResolve';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Cycle Count Resolve — SIGMA',
  description: 'Apply stock adjustments for variance.',
};

export default async function CycleCountResolvePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return (
    <div className="p-6">
      <ToastProvider>
        <CycleCountResolve id={id || ''} />
      </ToastProvider>
    </div>
  );
}
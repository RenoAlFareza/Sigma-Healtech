import type { Metadata } from 'next';
import { InboundList } from '@/features/inbound/InboundList';
import { InboundReceiving } from '@/features/inbound/InboundReceiving';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Inbound — SIGMA',
  description: 'Inbound receipts list.',
};

export default async function InboundPage({ searchParams }: PageProps<'/inbound'>) {
  const { id } = await searchParams;

  return (
    <div className="w-full">
      {typeof id === 'string' && id ? (
        <ToastProvider>
          <InboundReceiving id={id} />
        </ToastProvider>
      ) : (
        <InboundList />
      )}
    </div>
  );
}

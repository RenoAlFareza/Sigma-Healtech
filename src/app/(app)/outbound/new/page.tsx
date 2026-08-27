import type { Metadata } from 'next';
import { OutboundNew } from '@/features/outbound/OutboundNew';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'New Outbound — SIGMA',
  description: 'Create an outbound shipment.',
};

export default function NewOutboundPage() {
  return (
    <div className="p-6">
      <ToastProvider>
        <OutboundNew />
      </ToastProvider>
    </div>
  );
}
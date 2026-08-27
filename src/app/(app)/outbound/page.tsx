import type { Metadata } from 'next';
import { OutboundList } from '@/features/outbound/OutboundList';

export const metadata: Metadata = {
  title: 'Outbound — SIGMA',
  description: 'Outbound shipments list.',
};

export default function OutboundPage() {
  return (
    <div className="p-6">
      <OutboundList />
    </div>
  );
}
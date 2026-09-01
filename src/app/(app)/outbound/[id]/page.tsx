import type { Metadata } from 'next';
import { OutboundDetail } from '@/features/outbound/OutboundDetail';

export const metadata: Metadata = {
  title: 'Detail Outbound — SIGMA',
  description: 'Detail dokumen pengeluaran gudang farmasi.',
};

export default function OutboundDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full">
      <OutboundDetail id={params.id} />
    </div>
  );
}

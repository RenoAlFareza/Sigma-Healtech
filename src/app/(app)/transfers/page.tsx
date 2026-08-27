import type { Metadata } from 'next';
import { TransferList } from '@/features/transfers/TransferList';

export const metadata: Metadata = {
  title: 'Transfers — SIGMA',
  description: 'Stock transfers between units.',
};

export default function TransfersPage() {
  return (
    <div className="p-6">
      <TransferList />
    </div>
  );
}
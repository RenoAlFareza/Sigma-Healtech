import type { Metadata } from 'next';
import { TransferNew } from '@/features/transfers/TransferNew';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'New Transfer — SIGMA',
  description: 'Create a stock transfer.',
};

export default function NewTransferPage() {
  return (
    <div className="w-full">
      <ToastProvider>
        <TransferNew />
      </ToastProvider>
    </div>
  );
}

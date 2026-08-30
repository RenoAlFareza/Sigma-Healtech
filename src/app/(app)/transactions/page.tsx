import type { Metadata } from 'next';
import { TransactionManagement } from '@/features/transactions/TransactionManagement';

export const metadata: Metadata = {
  title: 'Transaction Management — SIGMA',
  description: 'Visualisasi arus mutasi, throughput, status dokumen, dan audit ledger supply chain.',
};

export default function TransactionsPage() {
  return <TransactionManagement />;
}

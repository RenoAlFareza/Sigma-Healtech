import { TransferDetail } from '@/features/transfers/TransferDetail';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detail Transfer Stok | SIGMA',
  description: 'Rincian surat jalan dan alokasi lot transfer stok obat',
};

export default function TransferDetailPage() {
  return <TransferDetail />;
}

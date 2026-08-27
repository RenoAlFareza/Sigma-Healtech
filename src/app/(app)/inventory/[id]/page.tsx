import type { Metadata } from 'next';
import { StockCard } from '@/features/inventory/StockCard';

export const metadata: Metadata = {
  title: 'Stock Card — SIGMA',
  description: 'Product stock card and transaction history.',
};

export default function StockCardPage() {
  return (
    <div className="p-6">
      <StockCard />
    </div>
  );
}
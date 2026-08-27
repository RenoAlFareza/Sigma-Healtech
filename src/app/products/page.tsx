import type { Metadata } from 'next';
import { ProductList } from '@/features/products/components/ProductList';

export const metadata: Metadata = {
  title: 'Products — SIGMA',
  description: 'Browse the KFA product catalog.',
};

export default function ProductsPage() {
  return (
    <div className="p-6">
      <ProductList />
    </div>
  );
}
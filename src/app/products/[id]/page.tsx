import type { Metadata } from 'next';
import { ProductDetail } from '@/features/products/components/ProductDetail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Product ${id} — SIGMA`,
    description: 'Product detail.',
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6 max-w-3xl">
      <ProductDetail productId={id} />
    </div>
  );
}
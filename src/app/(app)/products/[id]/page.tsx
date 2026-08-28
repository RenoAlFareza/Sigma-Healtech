import type { Metadata } from 'next';
import { ProductDetail } from '@/features/products/components/ProductDetail';

export async function generateMetadata({ params }: PageProps<'/products/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Product ${id} — SIGMA`,
    description: 'Product detail.',
  };
}

export default async function ProductDetailPage({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;
  return (
    <div className="max-w-3xl p-6">
      <ProductDetail productId={id} />
    </div>
  );
}

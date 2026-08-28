import type { Metadata } from 'next';
import { ProductForm } from '@/features/products/components/ProductForm';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Edit Product — SIGMA',
  description: 'Edit a product.',
};

export default async function EditProductPage({ params }: PageProps<'/products/[id]/edit'>) {
  const { id } = await params;
  return (
    <div className="max-w-3xl p-6">
      <ToastProvider>
        <ProductForm mode="edit" productId={id} />
      </ToastProvider>
    </div>
  );
}

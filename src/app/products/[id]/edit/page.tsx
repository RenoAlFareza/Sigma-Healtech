import type { Metadata } from 'next';
import { ProductForm } from '@/features/products/components/ProductForm';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Edit Product — SIGMA',
  description: 'Edit a product.',
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-6 max-w-3xl">
      <ToastProvider>
        <ProductForm mode="edit" productId={id} />
      </ToastProvider>
    </div>
  );
}
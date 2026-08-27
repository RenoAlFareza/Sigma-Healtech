import type { Metadata } from 'next';
import { ProductForm } from '@/features/products/components/ProductForm';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'New Product — SIGMA',
  description: 'Register a new product.',
};

export default function NewProductPage() {
  return (
    <div className="p-6 max-w-3xl">
      <ToastProvider>
        <ProductForm mode="create" />
      </ToastProvider>
    </div>
  );
}
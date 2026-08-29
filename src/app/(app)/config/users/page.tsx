import type { Metadata } from 'next';
import { UsersConfig } from '@/features/config/UsersConfig';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Users — SIGMA',
  description: 'Manage users and roles.',
};

export default function UsersPage() {
  return (
    <div className="w-full">
      <ToastProvider>
        <UsersConfig />
      </ToastProvider>
    </div>
  );
}

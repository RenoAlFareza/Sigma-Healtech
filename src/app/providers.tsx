"use client";

import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/shared/ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
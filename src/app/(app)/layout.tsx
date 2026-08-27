import React from 'react';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ActiveLocationProvider } from '@/features/shell/ActiveLocationContext';
import { AppShell } from '@/features/shell/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveLocationProvider>
      <AppShell>{children}</AppShell>
    </ActiveLocationProvider>
  );
}

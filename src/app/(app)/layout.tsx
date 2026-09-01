import React from 'react';
import { ActiveLocationProvider } from '@/features/shell/ActiveLocationContext';
import { AppShell } from '@/features/shell/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ActiveLocationProvider>
      <React.Suspense fallback={<div className="min-h-screen bg-[#f8faf9]" aria-label="Memuat navigasi" />}>
        <AppShell>{children}</AppShell>
      </React.Suspense>
    </ActiveLocationProvider>
  );
}

import type { Metadata } from 'next';
import { LocationsConfig } from '@/features/config/LocationsConfig';
import { ToastProvider } from '@/shared/ui';

export const metadata: Metadata = {
  title: 'Locations — SIGMA',
  description: 'Manage locations.',
};

export default function LocationsPage() {
  return (
    <div className="w-full">
      <ToastProvider>
        <LocationsConfig />
      </ToastProvider>
    </div>
  );
}

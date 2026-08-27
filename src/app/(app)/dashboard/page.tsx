import React from 'react';
import { getAuthContext } from '@/api';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { RequestorDashboard } from '@/features/dashboard/RequestorDashboard';

export const metadata = {
  title: 'Dashboard - SIGMA Supply Chain',
};

export default async function DashboardPage() {
  let role: string | null = null;
  
  try {
    const authContext = await getAuthContext();
    role = authContext.role;
  } catch {
    // If not authenticated or error, default to empty or standard view
  }

  if (role === 'REQUESTOR') {
    return <RequestorDashboard />;
  }

  return <DashboardView />;
}

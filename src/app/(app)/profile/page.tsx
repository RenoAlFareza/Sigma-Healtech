import React from 'react';
import { ProfileView } from '@/features/profile/ProfileView';

export const metadata = {
  title: 'Profil Pengguna | SIGMA Healtech',
  description: 'Halaman profil dan keamanan akun pengguna SIGMA Healtech Medical Logistics System',
};

export default function ProfilePage() {
  return <ProfileView />;
}

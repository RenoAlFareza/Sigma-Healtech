// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileView } from './ProfileView';


// Mock useAuth
const mockLogout = vi.fn();
vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'USR-ADMIN',
      username: 'admin',
      name: 'Dr. Ahmad Sanjaya, Sp.FRS',
      role: 'ADMIN',
      defaultLocationId: 'GUDANG-UTAMA',
      locationIds: ['GUDANG-UTAMA', 'DEPO-RAWAT-INAP'],
      active: true,
    },
    role: 'ADMIN',
    logout: mockLogout,
  }),
}));

describe('ProfileView', () => {
  it('renders user details, initials, and role badge accurately', () => {
    render(<ProfileView />);

    expect(screen.getAllByText('Dr. Ahmad Sanjaya, Sp.FRS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('System Administrator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('USR-ADMIN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GUDANG-UTAMA').length).toBeGreaterThan(0);
  });

  it('switches tabs between Profile Info, Security & Preferences, and Activity Log', () => {
    render(<ProfileView />);

    // Default tab is 'info'
    expect(screen.getByText('Detail Identitas Staf')).toBeInTheDocument();

    // Switch to Security tab
    fireEvent.click(screen.getByText('Keamanan & Preferensi'));
    expect(screen.getByText('Ubah Kata Sandi')).toBeInTheDocument();
    expect(screen.getByText('Notifikasi Operasional')).toBeInTheDocument();

    // Switch to Activity tab
    fireEvent.click(screen.getByText('Riwayat Aktivitas'));
    expect(screen.getByText('Log Aktivitas Terakhir')).toBeInTheDocument();
  });

  it('handles password change submission validation', () => {
    render(<ProfileView />);

    // Go to security tab
    fireEvent.click(screen.getByText('Keamanan & Preferensi'));

    // Submit empty form
    fireEvent.click(screen.getByText('Simpan Kata Sandi'));
    expect(screen.getByText('Semua bidang kata sandi wajib diisi.')).toBeInTheDocument();
  });
});

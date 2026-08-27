import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppShell } from './AppShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { ActiveLocationProvider } from './ActiveLocationContext';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard',
}));

describe('AppShell Component', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders topbar with logo, user menu, and role-filtered navigation', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Administrator Utama', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat', 'depo-rawat-inap'],
      menu: [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        { id: 'inventory', label: 'Inventory', href: '/inventory' },
      ],
      logout: mockLogout,
    });

    render(
      <ActiveLocationProvider>
        <AppShell>
          <div>Child Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    expect(screen.getByText('SIGMA')).toBeInTheDocument();
    expect(screen.getByText('Administrator Utama')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders LocationSwitcher ONLY when user has multiple locations (e.g. ADMIN/MANAGER)', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat', 'depo-rawat-inap'],
      menu: [],
      logout: mockLogout,
    });

    const { rerender } = render(
      <ActiveLocationProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    expect(screen.getByRole('combobox', { name: /Lokasi Aktif/i })).toBeInTheDocument();

    // Now test single location user (e.g., REQUESTOR or ASSISTANT)
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-nurse', name: 'Perawat', role: 'REQUESTOR' },
      role: 'REQUESTOR',
      defaultLocationId: 'apotek-rawat-jalan',
      locationIds: ['apotek-rawat-jalan'],
      menu: [],
      logout: mockLogout,
    });

    rerender(
      <ActiveLocationProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    expect(screen.queryByRole('combobox', { name: /Lokasi Aktif/i })).not.toBeInTheDocument();
  });

  it('triggers logout on clicking logout button', async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [],
      logout: mockLogout,
    });

    render(
      <ActiveLocationProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    const logoutBtn = screen.getByRole('button', { name: /Keluar/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('navigates to product search when GlobalSearch is submitted', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [],
      logout: mockLogout,
    });

    render(
      <ActiveLocationProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Cari produk, SKU, atau menu\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Paracetamol' } });
    
    const searchForm = screen.getByRole('search');
    fireEvent.submit(searchForm);

    expect(mockPush).toHaveBeenCalledWith('/products?search=Paracetamol');
  });
});

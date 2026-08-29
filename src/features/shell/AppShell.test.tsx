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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ lowStockCount: 5, stockoutCount: 2, pendingRequisitionsCount: 7 }),
    }));
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
    expect(screen.getByRole('button', { name: /Buka menu pengguna/i })).toBeInTheDocument();
    expect(screen.getByText('Administrator Utama')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('does not render the location switcher in the navbar', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat', 'depo-rawat-inap'],
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

    expect(screen.queryByRole('combobox', { name: /Lokasi Aktif/i })).not.toBeInTheDocument();
  });

  it('opens one accessible feature mega-menu with grouped destinations', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        {
          id: 'inventory',
          label: 'Inventory',
          groups: [
            {
              id: 'stock',
              label: 'Persediaan',
              items: [
                {
                  id: 'stock-card',
                  label: 'Kartu Stok & Lot',
                  href: '/inventory?view=stock-card',
                  description: 'Riwayat stok per produk',
                },
              ],
            },
          ],
        },
      ],
      logout: mockLogout,
    });

    render(
      <ActiveLocationProvider>
        <AppShell><div>Content</div></AppShell>
      </ActiveLocationProvider>
    );

    const trigger = screen.getByRole('button', { name: /Inventory/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: /Kartu Stok & Lot/i })).toHaveAttribute('href', '/inventory?view=stock-card');
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

    fireEvent.click(screen.getByRole('button', { name: /Buka menu pengguna/i }));
    const logoutBtn = screen.getAllByRole('button', { name: /Keluar/i }).at(-1)!;
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('opens global search from the header and navigates when submitted', () => {
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

    fireEvent.click(screen.getByRole('button', { name: /Buka pencarian global/i }));

    expect(screen.getByRole('dialog', { name: /Pencarian global/i })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Cari produk, SKU, atau menu\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Paracetamol' } });
    
    const searchForm = screen.getByRole('search');
    fireEvent.submit(searchForm);

    expect(mockPush).toHaveBeenCalledWith('/products?search=Paracetamol');
  });

  it('opens operational notifications with live summary counts', async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [],
      logout: mockLogout,
    });

    render(<ActiveLocationProvider><AppShell><div>Content</div></AppShell></ActiveLocationProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Notifikasi' }));
    expect(await screen.findByText('2 SKU stok habis')).toBeInTheDocument();
    expect(screen.getByText('7 permintaan menunggu')).toBeInTheDocument();
  });

  it('renders role-based sidebar quick action and mobile drawer', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [
        { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
        {
          id: 'outbound',
          label: 'Outbound',
          groups: [{ id: 'requests', label: 'Permintaan', items: [{ id: 'outbound-requisition-create', label: 'Buat Permintaan', href: '/requisitions/create' }] }],
        },
      ],
      logout: mockLogout,
    });

    render(<ActiveLocationProvider><AppShell><div>Content</div></AppShell></ActiveLocationProvider>);
    expect(screen.getAllByRole('link', { name: 'Buat Permintaan' })[0]).toHaveAttribute('href', '/requisitions/create');
    fireEvent.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
    expect(screen.getByRole('complementary', { name: 'Menu mobile' })).toBeInTheDocument();
  });
});

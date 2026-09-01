import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppShell } from './AppShell';
import { useAuth } from '@/features/auth/AuthProvider';
import { ActiveLocationProvider } from './ActiveLocationContext';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

const navigationState = vi.hoisted(() => ({ pathname: '/dashboard', search: '' }));
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => navigationState.pathname,
  useSearchParams: () => new URLSearchParams(navigationState.search),
}));

describe('AppShell Component (OpenBoxes Style)', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    navigationState.pathname = '/dashboard';
    navigationState.search = '';
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
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders OpenBoxes collapsible sidebar with 2 dashboards', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'usr-admin', name: 'Admin', role: 'ADMIN' },
      role: 'ADMIN',
      defaultLocationId: 'wh-pusat',
      locationIds: ['wh-pusat'],
      menu: [{ id: 'dashboard', label: 'Dashboard', href: '/dashboard' }],
      logout: mockLogout,
    });

    render(
      <ActiveLocationProvider>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </ActiveLocationProvider>
    );

    expect(screen.getByRole('complementary', { name: 'Navigasi pintas dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard Operasional/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Transaction Management/i })).toHaveAttribute('href', '/transactions');

    // Toggle collapse
    const toggleBtn = screen.getByRole('button', { name: /Tutup Sidebar/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Buka Sidebar/i })).toBeInTheDocument();
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

  it('keeps only the most specific route active and clears the previous open menu', () => {
    navigationState.pathname = '/inventory/reorder';
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
          groups: [{
            id: 'stock',
            label: 'Persediaan',
            items: [
              { id: 'inventory-view', label: 'Lihat Persediaan', href: '/inventory' },
              { id: 'inventory-reorder', label: 'Rekomendasi Reorder', href: '/inventory/reorder' },
            ],
          }],
        },
      ],
      logout: mockLogout,
    });

    render(<ActiveLocationProvider><AppShell><div>Content</div></AppShell></ActiveLocationProvider>);

    const inventoryTrigger = screen.getByRole('button', { name: /Inventory/i });
    fireEvent.click(inventoryTrigger);
    expect(screen.getByRole('link', { name: 'Rekomendasi Reorder' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Lihat Persediaan' })).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getAllByRole('link', { name: 'Dashboard' })[0]);
    expect(inventoryTrigger).toHaveAttribute('aria-expanded', 'false');
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

  it('opens global search as a header dropdown and navigates when submitted', () => {
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

    const searchBtn = screen.getByRole('button', { name: 'Pencarian global' });
    fireEvent.click(searchBtn);
    const searchInput = screen.getByPlaceholderText(/Search\.\.\. \(Press K\)/i);
    expect(screen.getByRole('region', { name: /Quick search results/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

  it('renders mobile navigation drawer on toggle', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
    expect(screen.getByRole('complementary', { name: 'Menu mobile' })).toBeInTheDocument();
  });
});

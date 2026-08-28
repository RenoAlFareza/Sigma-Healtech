"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Bell,
  Boxes,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackageSearch,
  Pill,
  Search,
  Settings2,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useActiveLocation } from './ActiveLocationContext';
import { locations as allLocations } from '@/api/_fixtures/users';

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: PackageSearch,
  requisitions: ClipboardList,
  outbound: ArrowUpFromLine,
  inbound: ArrowDownToLine,
  transfers: ArrowLeftRight,
  procurement: ShoppingCart,
  products: Pill,
  reports: ChartNoAxesColumnIncreasing,
  config: Settings2,
};

function getInitials(name?: string) {
  if (!name) return 'US';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, locationIds, menu, logout } = useAuth();
  const { activeLocationId, setActiveLocationId } = useActiveLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const userLocations = useMemo(
    () => allLocations.filter((location) => locationIds.includes(location.id)),
    [locationIds]
  );
  const activeLocation = userLocations.find((location) => location.id === activeLocationId);
  const showLocationSwitcher = userLocations.length > 1;
  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/products?search=${encodeURIComponent(query)}`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div
      className={`min-h-screen text-[var(--color-text-main)] ${
        isDashboard
          ? 'bg-[radial-gradient(circle_at_8%_3%,rgba(186,220,255,0.70)_0%,rgba(238,247,255,0.62)_28%,rgba(255,255,255,0.96)_66%),linear-gradient(135deg,#eaf4ff_0%,#ffffff_48%,#edf7ff_100%)]'
          : 'bg-[var(--color-core-50)]'
      }`}
    >
      <header className="sticky top-0 z-40 border-b border-[var(--color-core-100)] bg-white/95 shadow-[0_1px_12px_rgba(0,32,91,0.05)] backdrop-blur-xl">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex h-[68px] w-full max-w-[1536px] items-center gap-3 px-4 sm:px-6 lg:px-8"
        >
          <Link
            href="/dashboard"
            aria-label="SIGMA dashboard"
            className="group flex shrink-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-accent)] text-white shadow-[0_6px_16px_rgba(0,126,180,0.22)] transition-transform group-hover:-translate-y-0.5">
              <Boxes className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block text-[16px] font-bold tracking-[-0.03em] text-[var(--color-brand)]">
                SIGMA
              </span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-placeholder)]">
                Health Supply
              </span>
            </span>
          </Link>

          <div className="hidden h-7 w-px shrink-0 bg-[var(--color-core-100)] xl:block" />

          <div className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto xl:flex">
            {menu.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = NAV_ICONS[item.id] || LayoutDashboard;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] 2xl:gap-2 2xl:px-3 ${
                    isActive
                      ? 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)] shadow-[inset_0_0_0_1px_rgba(0,126,180,0.08)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-core-50)] hover:text-[var(--color-brand)]'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 ${
                      isActive
                        ? 'text-[var(--color-accent)]'
                        : 'text-[var(--color-text-placeholder)] group-hover:text-[var(--color-brand)]'
                    }`}
                    strokeWidth={1.8}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <form
              onSubmit={handleSearchSubmit}
              className="relative hidden w-[190px] 2xl:block 2xl:w-[240px]"
              role="search"
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-placeholder)]"
                strokeWidth={1.8}
              />
              <input
                id="global-search-input"
                type="search"
                placeholder="Cari produk, SKU, atau menu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-xl border border-transparent bg-[var(--color-core-50)] pl-10 pr-4 text-[10px] text-[var(--color-text-main)] outline-none transition placeholder:text-[var(--color-text-placeholder)] hover:bg-[var(--color-core-100)] focus:border-[var(--color-accent)] focus:bg-white focus:ring-4 focus:ring-[var(--color-accent-light)]"
              />
            </form>

            {showLocationSwitcher ? (
              <label className="hidden h-10 items-center gap-1.5 rounded-xl border border-[var(--color-core-100)] bg-white px-2.5 transition hover:border-[var(--color-core-300)] 2xl:flex">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" strokeWidth={1.9} />
                <span className="sr-only">Lokasi Aktif</span>
                <select
                  aria-label="Lokasi Aktif"
                  value={activeLocationId || ''}
                  onChange={(event) => setActiveLocationId(event.target.value)}
                  className="max-w-[145px] cursor-pointer bg-transparent text-[10px] font-semibold text-[var(--color-brand)] outline-none"
                >
                  {userLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : activeLocation ? (
              <div className="hidden h-10 items-center gap-1.5 rounded-xl border border-[var(--color-core-100)] px-2.5 text-[10px] font-semibold text-[var(--color-text-muted)] 2xl:flex">
                <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={1.9} />
                <span className="max-w-[130px] truncate">{activeLocation.name}</span>
              </div>
            ) : null}

            <button
              type="button"
              aria-label="Notifikasi"
              title="Notifikasi"
              className="relative hidden h-10 w-10 place-items-center rounded-xl text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] 2xl:grid"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#e25b52] ring-2 ring-white" />
            </button>

            <div ref={profileRef} className="relative hidden 2xl:block">
              <button
                type="button"
                aria-label="Buka menu pengguna"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((open) => !open)}
                className="flex h-11 items-center gap-2 rounded-xl p-1.5 pr-2 text-left transition hover:bg-[var(--color-core-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-white ring-2 ring-[var(--color-core-100)]">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden max-w-[110px] leading-tight min-[1450px]:block">
                  <span className="block truncate text-[10px] font-bold text-[var(--color-brand)]">
                    {user?.name || 'User'}
                  </span>
                  <span className="mt-0.5 block text-[8px] font-medium uppercase tracking-wide text-[var(--color-text-placeholder)]">
                    {role || 'VIEWER'}
                  </span>
                </span>
                <ChevronDown
                  className={`hidden h-3.5 w-3.5 text-[var(--color-text-placeholder)] transition-transform min-[1450px]:block ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-[var(--color-core-100)] bg-white p-2 shadow-[0_18px_45px_rgba(0,32,91,0.14)]">
                  <div className="rounded-xl bg-[var(--color-core-50)] px-3 py-3">
                    <p className="truncate text-xs font-bold text-[var(--color-brand)]">{user?.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
                      <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-1 font-bold text-[var(--color-accent-hover)]">
                        {role || 'VIEWER'}
                      </span>
                      <span className="truncate text-[var(--color-text-muted)]">
                        {activeLocation?.code || activeLocationId}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#a1433d] transition hover:bg-[#fff1ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e25b52]"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    Keluar
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isMobileMenuOpen}
              className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--color-core-100)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-accent-light)] xl:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="border-t border-[var(--color-core-100)] bg-white px-4 pb-5 pt-4 shadow-[0_16px_30px_rgba(0,32,91,0.08)] xl:hidden">
            <form onSubmit={handleSearchSubmit} className="relative mb-4" role="search">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-placeholder)]" />
              <input
                type="search"
                aria-label="Pencarian mobile"
                placeholder="Cari produk, SKU, atau menu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--color-core-100)] bg-[var(--color-core-50)] pl-10 pr-4 text-xs outline-none focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-light)]"
              />
            </form>

            {showLocationSwitcher && (
              <label className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--color-core-100)] bg-white px-3 py-2.5">
                <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="sr-only">Lokasi Aktif Mobile</span>
                <select
                  aria-label="Lokasi Aktif Mobile"
                  value={activeLocationId || ''}
                  onChange={(event) => setActiveLocationId(event.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[var(--color-brand)] outline-none"
                >
                  {userLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {menu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = NAV_ICONS[item.id] || LayoutDashboard;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[var(--color-accent-light)] text-[var(--color-accent-hover)]'
                        : 'border border-[var(--color-core-100)] text-[var(--color-text-muted)] hover:bg-[var(--color-core-50)]'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-core-50)] p-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-white">
                  {getInitials(user?.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[var(--color-brand)]">{user?.name}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-text-placeholder)]">
                    {role || 'VIEWER'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#a1433d] hover:bg-[#fff1ef]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1536px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className={`border-t border-[var(--color-core-100)] py-4 ${isDashboard ? 'bg-white/70 backdrop-blur-xl' : 'bg-white'}`}>
        <div className="mx-auto max-w-[1536px] px-4 text-center text-[10px] font-medium text-[var(--color-text-placeholder)]">
          SIGMA Health Supply &copy; {new Date().getFullYear()} · Healthcare Supply Chain System
        </div>
      </footer>
    </div>
  );
}

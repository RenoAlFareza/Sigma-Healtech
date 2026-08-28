"use client";

import React, { useEffect, useRef, useState } from 'react';
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
  Menu,
  PackageSearch,
  Pill,
  Search,
  Settings2,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';

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
  const { user, role, menu, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 0);
      }
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
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
    setIsSearchOpen(false);
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
      <header className="sticky top-0 z-40 bg-[#f3f6fb]/90 px-3 py-3 backdrop-blur-xl sm:px-5 lg:px-8">
        <nav
          aria-label="Navigasi utama"
          className="relative mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-3 rounded-full border border-white/90 bg-white/90 px-3.5 shadow-[0_10px_35px_rgba(37,61,93,0.07)] backdrop-blur-xl sm:px-5"
        >
          <Link
            href="/dashboard"
            aria-label="SIGMA dashboard"
            className="group flex shrink-0 items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eaf2ff] text-[#0a65ff] transition-transform group-hover:-translate-y-0.5">
              <Boxes className="h-[19px] w-[19px]" strokeWidth={2.35} />
            </span>
            <span className="hidden leading-none sm:block">
              <span className="block text-[17px] font-extrabold tracking-[-0.035em] text-[#14213a]">
                SIGMA
              </span>
              <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.15em] text-[#9aa6b6]">
                Health Supply
              </span>
            </span>
          </Link>

          <div className="absolute left-1/2 hidden max-w-[760px] -translate-x-1/2 items-center gap-0.5 rounded-full border border-[#e8ebf0] bg-[#f6f7f9] p-1 min-[1320px]:flex">
            {menu.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex h-9 shrink-0 items-center rounded-full px-2.5 text-[9px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff] min-[1450px]:px-3 min-[1450px]:text-[10px] ${
                    isActive
                      ? 'bg-[#0a65ff] text-white shadow-[0_6px_14px_rgba(10,101,255,0.22)]'
                      : 'text-[#687386] hover:bg-white hover:text-[#18243a]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <form
              onSubmit={handleSearchSubmit}
              className={`absolute right-3 top-[calc(100%+12px)] w-[min(360px,calc(100vw-24px))] rounded-[22px] border border-[#e5eaf1] bg-white p-2 shadow-[0_20px_55px_rgba(37,61,93,0.16)] transition-all duration-200 sm:right-5 ${
                isSearchOpen
                  ? 'visible translate-y-0 opacity-100'
                  : 'pointer-events-none invisible -translate-y-2 opacity-0'
              }`}
              role="search"
            >
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a96a8]"
                strokeWidth={1.8}
              />
              <input
                id="global-search-input"
                type="search"
                placeholder="Cari produk, SKU, atau menu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 w-full rounded-2xl border border-transparent bg-[#f5f7fa] pl-10 pr-4 text-xs text-[#1b2940] outline-none transition placeholder:text-[#9aa5b5] focus:border-[#b9d3ff] focus:bg-white focus:ring-4 focus:ring-[#eaf2ff]"
              />
            </form>

            <button
              type="button"
              aria-label="Buka pencarian"
              aria-expanded={isSearchOpen}
              onClick={() => {
                setIsSearchOpen((open) => !open);
                window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 0);
              }}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-[#f5f6f8] text-[#354156] transition hover:bg-[#eaf2ff] hover:text-[#0a65ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff]"
            >
              <Search className="h-4 w-4" strokeWidth={1.9} />
              <span className="sr-only">Shortcut Ctrl K</span>
            </button>

            <button
              type="button"
              aria-label="Notifikasi"
              title="Notifikasi"
              className="relative grid h-10 w-10 place-items-center rounded-full bg-[#f5f6f8] text-[#354156] transition hover:bg-[#eaf2ff] hover:text-[#0a65ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff]"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ff6760] ring-2 ring-[#f5f6f8]" />
            </button>

            <div className="mx-0.5 hidden h-6 w-px bg-[#e5e8ed] sm:block" />

            <div ref={profileRef} className="relative">
              <button
                type="button"
                aria-label="Buka menu pengguna"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((open) => !open)}
                className="group flex h-11 items-center gap-2.5 rounded-full p-1 pr-2 text-left transition hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#2158a8,#173768)] text-[10px] font-bold text-white ring-2 ring-[#e9eef5] transition group-hover:ring-[#bcd4ff]">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden max-w-[120px] leading-tight min-[1450px]:block">
                  <span className="block truncate text-[10px] font-bold text-[#18243a]">
                    {user?.name || 'User'}
                  </span>
                  <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-wide text-[#9aa5b5]">
                    {role || 'VIEWER'}
                  </span>
                </span>
                <ChevronDown
                  className={`hidden h-3.5 w-3.5 text-[#9aa5b5] transition-transform min-[1450px]:block ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-[calc(100%+14px)] w-64 overflow-hidden rounded-[22px] border border-[#e5eaf1] bg-white p-2 shadow-[0_20px_55px_rgba(37,61,93,0.16)]">
                  <div className="rounded-2xl bg-[#f6f8fb] px-3 py-3">
                    <p className="truncate text-xs font-bold text-[var(--color-brand)]">{user?.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px]">
                      <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-1 font-bold text-[var(--color-accent-hover)]">
                        {role || 'VIEWER'}
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
              className="grid h-10 w-10 place-items-center rounded-full bg-[#f5f6f8] text-[#354156] transition hover:bg-[#eaf2ff] hover:text-[#0a65ff] min-[1320px]:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-[1440px] rounded-[28px] border border-white/90 bg-white/95 px-4 pb-5 pt-4 shadow-[0_18px_45px_rgba(37,61,93,0.10)] min-[1320px]:hidden">
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

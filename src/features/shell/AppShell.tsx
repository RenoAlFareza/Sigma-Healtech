"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Boxes,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Eye,
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
import type { MenuItem } from '@/shared/config/menu';

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: PackageSearch,
  outbound: ArrowUpFromLine,
  inbound: ArrowDownToLine,
  purchasing: ShoppingCart,
  products: Pill,
  reporting: ChartNoAxesColumnIncreasing,
};

function routePath(href: string) {
  return href.split('?')[0];
}

function isRouteActive(pathname: string, href: string) {
  const path = routePath(href);
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isMenuActive(pathname: string, item: MenuItem) {
  if (item.href) return isRouteActive(pathname, item.href);
  return item.groups?.some((group) => group.items.some((destination) => isRouteActive(pathname, destination.href))) ?? false;
}

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMobileSectionId, setOpenMobileSectionId] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setOpenMenuId(null);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    };
  }, []);

  const cancelScheduledMenuClose = () => {
    if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
  };

  const scheduleMenuClose = () => {
    cancelScheduledMenuClose();
    closeMenuTimerRef.current = setTimeout(() => setOpenMenuId(null), 140);
  };

  const openDesktopMenu = (menuId: string) => {
    cancelScheduledMenuClose();
    setOpenMenuId(menuId);
  };

  const handlePrimaryKeyDown = (event: React.KeyboardEvent<HTMLElement>, item: MenuItem, index: number) => {
    const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-primary-navigation]'));
    const focusTrigger = (targetIndex: number) => triggers[targetIndex]?.focus();

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusTrigger((index + 1) % triggers.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusTrigger((index - 1 + triggers.length) % triggers.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusTrigger(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusTrigger(triggers.length - 1);
    } else if (event.key === 'ArrowDown' && item.groups) {
      event.preventDefault();
      openDesktopMenu(item.id);
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-mega-panel="${item.id}"] a`)?.focus();
      }, 0);
    }
  };

  const openMenu = menu.find((item) => item.id === openMenuId && item.groups);

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
      <header className="sticky top-0 z-40 bg-transparent px-3 pb-3 pt-9 sm:px-5 lg:px-8">
        <nav
          aria-label="Navigasi utama"
          className="relative mx-auto flex h-[68px] w-full max-w-[1680px] items-center gap-3 rounded-full border border-white/90 bg-white/90 px-3.5 shadow-[0_10px_35px_rgba(37,61,93,0.07)] backdrop-blur-xl sm:px-5"
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

          <div
            ref={megaMenuRef}
            className="absolute left-1/2 hidden max-w-[1080px] -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#e8ebf0] bg-[#f6f7f9] p-1 min-[1320px]:flex"
            onMouseEnter={cancelScheduledMenuClose}
            onMouseLeave={scheduleMenuClose}
          >
            {menu.map((item, index) => {
              const isActive = isMenuActive(pathname, item);
              const hasChildren = Boolean(item.groups?.length);
              const commonClassName = `relative flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[10px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b8ec6] min-[1450px]:px-4 min-[1450px]:text-[11px] min-[1600px]:px-[18px] min-[1600px]:text-xs ${
                isActive
                  ? 'bg-[#0a65ff] text-white shadow-[0_6px_14px_rgba(10,101,255,0.22)]'
                  : openMenuId === item.id
                    ? 'bg-white text-[#174f94] shadow-sm'
                    : 'text-[#687386] hover:bg-white hover:text-[#18243a]'
              }`;

              if (!hasChildren && item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    data-primary-navigation
                    aria-current={isActive ? 'page' : undefined}
                    onFocus={() => setOpenMenuId(null)}
                    onKeyDown={(event) => handlePrimaryKeyDown(event, item, index)}
                    className={commonClassName}
                  >
                    {item.label}
                    {isActive && <span className="sr-only">, halaman aktif</span>}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  data-primary-navigation
                  aria-expanded={openMenuId === item.id}
                  aria-controls={`mega-menu-${item.id}`}
                  onMouseEnter={() => openDesktopMenu(item.id)}
                  onClick={() => setOpenMenuId((current) => current === item.id ? null : item.id)}
                  onKeyDown={(event) => handlePrimaryKeyDown(event, item, index)}
                  className={commonClassName}
                >
                  {item.label}
                  <ChevronDown className={`h-3 w-3 transition-transform ${openMenuId === item.id ? 'rotate-180' : ''}`} strokeWidth={2} aria-hidden="true" />
                  {isActive && <span className="sr-only">, bagian aktif</span>}
                </button>
              );
            })}

            {openMenu?.groups && (
              <div
                id={`mega-menu-${openMenu.id}`}
                data-mega-panel={openMenu.id}
                className={`absolute left-1/2 top-[calc(100%+14px)] max-h-[min(70vh,560px)] -translate-x-1/2 overflow-y-auto rounded-[22px] border border-[#dfe6ee] bg-white p-3 shadow-[0_24px_60px_rgba(26,52,83,0.18)] ${
                  openMenu.groups.length >= 3
                    ? 'w-[min(760px,calc(100vw-40px))]'
                    : openMenu.groups.length === 2
                      ? 'w-[min(620px,calc(100vw-40px))]'
                      : 'w-[min(420px,calc(100vw-40px))]'
                }`}
                onMouseEnter={cancelScheduledMenuClose}
                onMouseLeave={scheduleMenuClose}
              >
                <div className={`grid gap-3 ${openMenu.groups.length >= 3 ? 'grid-cols-3' : openMenu.groups.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {openMenu.groups.map((group) => (
                    <section key={group.id} aria-labelledby={`mega-group-${group.id}`} className="min-w-0 rounded-2xl bg-[#f8fafc] p-2.5">
                      <h2 id={`mega-group-${group.id}`} className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#8a98a9]">
                        {group.label}
                      </h2>
                      <div className="space-y-1">
                        {group.items.map((destination) => {
                          const childActive = isRouteActive(pathname, destination.href);
                          return (
                            <Link
                              key={destination.id}
                              href={destination.href}
                              aria-current={childActive ? 'page' : undefined}
                              onClick={() => setOpenMenuId(null)}
                              className={`group/item flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b8ec6] ${
                                childActive ? 'bg-[#eaf3ff] text-[#174f94]' : 'text-[#314258] hover:bg-white hover:shadow-sm'
                              }`}
                            >
                              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${childActive ? 'bg-[#0a65ff] ring-4 ring-[#dcecff]' : 'bg-[#bdc8d4] group-hover/item:bg-[#5b92d5]'}`} aria-hidden="true" />
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-[11px] font-bold">
                                  {destination.label}
                                  {destination.readOnly && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#6c7e91]">
                                      <Eye className="h-2.5 w-2.5" aria-hidden="true" /> View
                                    </span>
                                  )}
                                </span>
                                {destination.description && (
                                  <span className="mt-1 block text-[9px] font-medium leading-4 text-[#8291a2]">{destination.description}</span>
                                )}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
                className="group grid h-10 w-10 place-items-center rounded-full transition hover:bg-[#f5f7fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a65ff]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#2158a8,#173768)] text-[10px] font-bold text-white ring-2 ring-[#e9eef5] transition group-hover:ring-[#bcd4ff]">
                  {getInitials(user?.name)}
                </span>
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
                  {role === 'ADMIN' && (
                    <Link
                      href="/config/users"
                      onClick={() => setIsProfileOpen(false)}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#43566d] transition hover:bg-[#eef4fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b8ec6]"
                    >
                      <Settings2 className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      Pengaturan teknis
                    </Link>
                  )}
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
          <div className="mx-auto mt-2 max-w-[1680px] rounded-[28px] border border-white/90 bg-white/95 px-4 pb-5 pt-4 shadow-[0_18px_45px_rgba(37,61,93,0.10)] min-[1320px]:hidden">
            <div className="space-y-2">
              {menu.map((item) => {
                const isActive = isMenuActive(pathname, item);
                const Icon = NAV_ICONS[item.id] || LayoutDashboard;
                const isExpanded = openMobileSectionId === item.id;

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-[#eaf3ff] text-[#17579f]'
                          : 'border border-[#e5ebf2] text-[#64768b] hover:bg-[#f7f9fc]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <section key={item.id} className="overflow-hidden rounded-2xl border border-[#e5ebf2] bg-white">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-menu-${item.id}`}
                      onClick={() => setOpenMobileSectionId((current) => current === item.id ? null : item.id)}
                      className={`flex w-full items-center gap-2.5 px-3 py-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0b8ec6] ${
                        isActive ? 'bg-[#eaf3ff] text-[#17579f]' : 'text-[#64768b] hover:bg-[#f7f9fc]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    {isExpanded && item.groups && (
                      <div id={`mobile-menu-${item.id}`} className="border-t border-[#e8edf3] bg-[#f9fbfd] px-3 pb-3 pt-2">
                        {item.groups.map((group) => (
                          <div key={group.id} className="mt-2 first:mt-0">
                            <p className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#94a1b0]">{group.label}</p>
                            <div className="space-y-1">
                              {group.items.map((destination) => (
                                <Link
                                  key={destination.id}
                                  href={destination.href}
                                  onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setOpenMobileSectionId(null);
                                  }}
                                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b8ec6] ${
                                    isRouteActive(pathname, destination.href)
                                      ? 'bg-white text-[#17579f] shadow-sm'
                                      : 'text-[#5f7186] hover:bg-white'
                                  }`}
                                >
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#91a1b3]" aria-hidden="true" />
                                  <span className="flex-1">{destination.label}</span>
                                  {destination.readOnly && <Eye className="h-3.5 w-3.5 text-[#7c8ea1]" aria-label="Hanya lihat" />}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
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

      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#1a2638]/40 px-4 pt-[12vh] backdrop-blur-[2px]"
          onMouseDown={() => setIsSearchOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white p-4 shadow-[0_28px_80px_rgba(20,36,58,0.24)] sm:p-5"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="global-search-title" className="sr-only">Pencarian global</h2>
            <form onSubmit={handleSearchSubmit} className="relative" role="search">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a96a8]"
                strokeWidth={1.8}
              />
              <input
                id="global-search-input"
                autoFocus
                type="search"
                placeholder="Cari produk, SKU, atau menu..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 w-full rounded-full border border-[#dfe5ed] bg-[#f8fafc] pl-12 pr-12 text-xs font-medium text-[#1b2940] outline-none transition placeholder:text-[#9aa5b5] focus:border-[#9bc2ff] focus:bg-white focus:ring-4 focus:ring-[#eaf2ff] sm:h-14 sm:text-sm"
              />
              <button
                type="button"
                aria-label="Tutup pencarian"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#98a3b2] transition hover:bg-[#edf2f7] hover:text-[#344156]"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </form>
            <p className="px-3 pt-3 text-[10px] font-medium text-[#929eae] sm:text-[11px]">
              Tekan ESC atau klik area luar untuk menutup
            </p>
          </div>
        </div>
      )}

      <main className="mx-auto min-h-[calc(100vh-115px)] w-full max-w-[1728px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className={`border-t border-[var(--color-core-100)] py-4 ${isDashboard ? 'bg-white/70 backdrop-blur-xl' : 'bg-white'}`}>
        <div className="mx-auto max-w-[1728px] px-4 text-center text-[10px] font-medium text-[var(--color-text-placeholder)]">
          SIGMA Health Supply &copy; {new Date().getFullYear()} · Healthcare Supply Chain System
        </div>
      </footer>
    </div>
  );
}

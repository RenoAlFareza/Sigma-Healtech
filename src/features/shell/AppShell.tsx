"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Boxes,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Repeat2,
  Search,
  Settings2,
  ShoppingCart,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import type { MenuDestination, MenuItem } from '@/shared/config/menu';

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: Boxes,
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

interface SearchParamReader {
  get(name: string): string | null;
}

function routeMatchScore(pathname: string, searchParams: SearchParamReader, href: string, allowQueryFallback = false) {
  const [path, query = ''] = href.split('?');
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return -1;

  const expectedParams = new URLSearchParams(query);
  let queryScore = 0;
  for (const [key, value] of expectedParams) {
    if (searchParams.get(key) !== value) {
      if (!allowQueryFallback) return -1;
      queryScore = -100;
      break;
    }
    queryScore += 20;
  }

  return path.length * 100 + (pathname === path ? 10 : 0) + queryScore;
}

function activeMenuId(pathname: string, searchParams: SearchParamReader, menu: MenuItem[]) {
  let bestMatch: { id: string; score: number } | null = null;

  for (const item of menu) {
    const hrefs = item.href
      ? [item.href]
      : item.groups?.flatMap((group) => group.items.map((destination) => destination.href)) ?? [];

    for (const href of hrefs) {
      const score = routeMatchScore(pathname, searchParams, href, true);
      if (score >= 0 && (!bestMatch || score > bestMatch.score)) bestMatch = { id: item.id, score };
    }
  }

  return bestMatch?.id ?? null;
}

function activeDestinationId(pathname: string, searchParams: SearchParamReader, item: MenuItem) {
  let bestMatch: { id: string; score: number } | null = null;

  for (const destination of item.groups?.flatMap((group) => group.items) ?? []) {
    const score = routeMatchScore(pathname, searchParams, destination.href);
    if (score >= 0 && (!bestMatch || score > bestMatch.score)) bestMatch = { id: destination.id, score };
  }

  return bestMatch?.id ?? null;
}

function getInitials(name?: string) {
  if (!name) return 'US';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

interface DashboardNotificationSummary {
  lowStockCount: number;
  stockoutCount: number;
  pendingRequisitionsCount: number;
}

const DASHBOARD_SIDEBAR_ITEMS = [
  {
    id: 'dashboard-overview',
    label: 'Dashboard Operasional',
    shortLabel: 'Operasional',
    href: '/dashboard',
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    id: 'transaction-overview',
    label: 'Transaction Management',
    shortLabel: 'Transaksi',
    href: '/transactions',
    icon: Repeat2,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role, menu, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMobileSectionId, setOpenMobileSectionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationSummary, setNotificationSummary] = useState<DashboardNotificationSummary | null>(null);
  const desktopPopoverRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const searchPopoverRef = useRef<HTMLDivElement>(null);

  const searchableItems = useMemo<MenuDestination[]>(() => menu.flatMap((item) => {
    if (item.href) {
      return [{ id: item.id, label: item.label, href: item.href, description: `Buka halaman ${item.label}` }];
    }
    return item.groups?.flatMap((group) => group.items) ?? [];
  }), [menu]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    if (!query) return [];
    return searchableItems
      .filter((item) => `${item.label} ${item.description ?? ''}`.toLocaleLowerCase('id-ID').includes(query))
      .slice(0, 6);
  }, [searchQuery, searchableItems]);

  const currentActiveMenuId = activeMenuId(pathname, searchParams, menu);

  const closePopovers = () => {
    setOpenMenuId(null);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsHelpOpen(false);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        closePopovers();
        setIsSearchOpen(true);
        window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 0);
      }
      if (event.key === 'Escape') {
        closePopovers();
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!searchPopoverRef.current?.contains(target)) setIsSearchOpen(false);
      if (!desktopPopoverRef.current?.contains(target) && !sidebarRef.current?.contains(target)) closePopovers();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let active = true;
    fetch('/api/dashboard/summary')
      .then((response) => response.ok ? response.json() as Promise<DashboardNotificationSummary> : null)
      .then((summary) => { if (active && summary) setNotificationSummary(summary); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/products?search=${encodeURIComponent(query)}`);
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8faf9] text-[#1b2a24]">
      {/* 1. TOP NAVBAR (FULL WIDTH ACROSS ENTIRE SCREEN - OPENBOXES STYLE) */}
      <header className="sticky top-0 z-40 w-full border-b border-[#e5eae7] bg-white/95 backdrop-blur-md">
        <div ref={desktopPopoverRef} className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Top Left: Logo (aligned) + Navigation Menu (comfortably spaced) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
            {/* Logo SIGMA */}
            <div className="flex w-36 shrink-0 items-center sm:w-44 lg:w-48">
              <Link href="/dashboard" className="flex items-center transition opacity-95 hover:opacity-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.svg"
                  alt="SIGMA Logo"
                  className="h-9 w-auto object-contain"
                />
                <span className="sr-only">SIGMA</span>
              </Link>
            </div>

            {/* Top Navigation Tabs (Starts neatly to the right of the sidebar) */}
            <nav aria-label="Navigasi utama" className="hidden items-center gap-1.5 min-[1080px]:flex xl:gap-2.5">
              {menu.map((item) => {
                const Icon = NAV_ICONS[item.id] || LayoutDashboard;
                const active = currentActiveMenuId === item.id;
                const currentActiveDestinationId = activeDestinationId(pathname, searchParams, item);
                const hasChildren = Boolean(item.groups?.length);
                const triggerClass = `flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 xl:px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] ${
                  active || openMenuId === item.id
                    ? 'bg-[#e8f5e9] text-[#2d6a4f] shadow-sm'
                    : 'text-[#52665d] hover:bg-[#f1f5f3] hover:text-[#1b2a24]'
                }`;

                if (!hasChildren && item.href) {
                  return (
                    <Link key={item.id} href={item.href} onClick={closePopovers} aria-current={active ? 'page' : undefined} className={triggerClass}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      aria-expanded={openMenuId === item.id}
                      aria-controls={`nav-popover-${item.id}`}
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsNotificationsOpen(false);
                        setOpenMenuId((current) => (current === item.id ? null : item.id));
                      }}
                      className={triggerClass}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${openMenuId === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openMenuId === item.id && item.groups && (
                      <div
                        id={`nav-popover-${item.id}`}
                        className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14),0_4px_10px_-2px_rgba(27,42,36,0.06)]"
                      >
                        {item.groups.map((group, groupIndex) => (
                          <section key={group.id} className={`${groupIndex > 0 ? 'mt-2.5 border-t border-[#edf1ee] pt-2.5' : ''}`} aria-labelledby={`popover-group-${group.id}`}>
                            <h2 id={`popover-group-${group.id}`} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca8a2]">
                              <Folder className="h-3 w-3 text-[#2d6a4f]" />/{group.label}
                            </h2>
                            <div className="mt-1 space-y-0.5">
                              {group.items.map((destination) => (
                                <Link
                                  key={destination.id}
                                  href={destination.href}
                                  onClick={closePopovers}
                                  aria-current={currentActiveDestinationId === destination.id ? 'page' : undefined}
                                  className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition ${
                                    currentActiveDestinationId === destination.id
                                      ? 'bg-[#e8f5e9] text-[#2d6a4f]'
                                      : 'text-[#31483c] hover:bg-[#f1f5f3] hover:text-[#2d6a4f]'
                                  }`}
                                >
                                  <span className="truncate">{destination.label}</span>
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                </Link>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Top Right: Search + Notifications + User Profile */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {/* Search Icon Button */}
            <div ref={searchPopoverRef} className="relative">
              <button
                type="button"
                aria-label="Pencarian global"
                aria-expanded={isSearchOpen}
                aria-controls="header-search-popover"
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsNotificationsOpen(false);
                  setOpenMenuId(null);
                  setIsSearchOpen((open) => !open);
                  if (!isSearchOpen) {
                    window.setTimeout(() => document.getElementById('global-search-input')?.focus(), 50);
                  }
                }}
                className="relative grid h-8 w-8 place-items-center rounded-full border border-[#dfe6e2] bg-[#f8faf9] text-[#52665d] transition hover:bg-[#eef3f0]"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              {isSearchOpen && (
                <div
                  id="header-search-popover"
                  className="absolute right-0 top-full z-50 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_14px_32px_rgba(27,42,36,0.16)]"
                >
                  <form onSubmit={handleSearchSubmit} role="search" className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#789087]" />
                    <input
                      id="global-search-input"
                      type="search"
                      role="combobox"
                      aria-label="Pencarian global"
                      aria-expanded={isSearchOpen}
                      aria-controls="global-search-results"
                      autoComplete="off"
                      placeholder="Search... (Press K)"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-9 w-full rounded-xl border border-[#2d6a4f] bg-white pl-9 pr-9 text-xs font-medium text-[#1b2a24] outline-none transition placeholder:text-[#a1ada7] hover:bg-[#fbfdfc] focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden"
                      autoFocus
                    />
                    <kbd className="pointer-events-none absolute right-2.5 top-1/2 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded border border-[#e1e7e3] bg-[#f7f9f8] px-1 text-[9px] font-bold text-[#8b9a92]">
                      K
                    </kbd>
                  </form>

                  <div id="global-search-results" role="region" aria-label="Quick search results" className="mt-2.5">
                    <div className="flex items-center justify-between border-b border-[#edf1ee] px-1 pb-2">
                      <strong className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#9aa8a1]">
                        Quick Search &amp; Results
                      </strong>
                      <span className="text-[9px] font-bold text-[#2d6a4f]">{searchResults.length} results</span>
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="max-h-72 space-y-0.5 overflow-y-auto pt-1">
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            href={result.href}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-[#f1f5f3]"
                          >
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8f5e9] text-[#2d6a4f]">
                              <Search className="h-3 w-3" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block truncate text-xs text-[#1b2a24]">{result.label}</strong>
                              <small className="block truncate text-[10px] text-[#6b7c74]">{result.description}</small>
                            </span>
                            <span className="rounded-md border border-[#e5eae7] bg-[#f8faf9] px-2 py-0.5 text-[9px] font-semibold text-[#6b7c74]">
                              Buka
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : searchQuery.trim() ? (
                      <p className="p-4 text-center text-xs text-[#6b7c74]">Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      <p className="p-3 text-center text-[10px] text-[#9ca8a2]">Ketik nama modul atau obat untuk mencari...</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifikasi"
                aria-expanded={isNotificationsOpen}
                aria-controls="header-notifications-popover"
                onClick={() => {
                  setIsProfileOpen(false);
                  setOpenMenuId(null);
                  setIsNotificationsOpen((open) => !open);
                }}
                className="relative grid h-8 w-8 place-items-center rounded-full border border-[#dfe6e2] bg-[#f8faf9] text-[#52665d] transition hover:bg-[#eef3f0]"
              >
                <Bell className="h-3.5 w-3.5" />
                {Boolean(notificationSummary?.pendingRequisitionsCount || notificationSummary?.stockoutCount) && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
                )}
              </button>
              {isNotificationsOpen && (
                <div id="header-notifications-popover" className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
                  <div className="flex items-center justify-between border-b border-[#edf1ee] pb-2">
                    <strong className="text-xs font-bold text-[#1b2a24]">Notifikasi Logistik</strong>
                    <span className="text-[10px] text-[#6b7c74]">Real-time</span>
                  </div>
                  <div className="mt-2 space-y-2 text-xs">
                    <Link href="/reports?type=stockout" onClick={closePopovers} className="flex items-start gap-2.5 rounded-xl p-2 transition hover:bg-[#f8faf9]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600"><Boxes className="h-3.5 w-3.5" /></span>
                      <div>
                        <strong className="block text-[11px] font-bold text-[#1b2a24]">{notificationSummary?.stockoutCount ?? 0} SKU stok habis</strong>
                        <p className="text-[10px] text-[#6b7c74]">Perlu tindak lanjut reorder segera.</p>
                      </div>
                    </Link>
                    <Link href="/requisitions" onClick={closePopovers} className="flex items-start gap-2.5 rounded-xl p-2 transition hover:bg-[#f8faf9]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><ArrowUpFromLine className="h-3.5 w-3.5" /></span>
                      <div>
                        <strong className="block text-[11px] font-bold text-[#1b2a24]">{notificationSummary?.pendingRequisitionsCount ?? 0} permintaan menunggu</strong>
                        <p className="text-[10px] text-[#6b7c74]">Requisition dari unit belum disetujui.</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Popover */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Buka menu pengguna"
                aria-expanded={isProfileOpen}
                aria-controls="header-profile-popover"
                onClick={() => {
                  setIsNotificationsOpen(false);
                  setOpenMenuId(null);
                  setIsProfileOpen((open) => !open);
                }}
                className="flex h-8 items-center gap-1.5 rounded-full border border-[#dfe6e2] bg-[#f8faf9] py-1 pl-1 pr-2 transition hover:bg-[#eef3f0]"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2d6a4f] text-[10px] font-bold text-white">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden max-w-24 truncate text-[11px] font-semibold text-[#1b2a24] sm:inline-block lg:max-w-32">{user?.name ?? 'Pengguna'}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-[#9ca8a2]" />
              </button>
              {isProfileOpen && (
                <div id="header-profile-popover" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
                  <div className="border-b border-[#edf1ee] pb-2">
                    <strong className="block truncate text-xs font-bold text-[#1b2a24]">{user?.name}</strong>
                    <span className="inline-block rounded-md bg-[#e8f5e9] px-2 py-0.5 text-[9px] font-bold text-[#2d6a4f]">
                      Role: {role}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {role === 'ADMIN' && (
                      <Link href="/config/users" onClick={closePopovers} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs text-[#1b2a24] transition hover:bg-[#f1f5f3]">
                        <Settings2 className="h-3.5 w-3.5 text-[#6b7c74]" />
                        <span>Pengaturan Pengguna</span>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              aria-label="Buka menu navigasi"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-[#dfe6e2] text-[#52665d] min-[1080px]:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <aside role="complementary" aria-label="Menu mobile" className="border-b border-[#e5eae7] bg-white p-4 min-[1080px]:hidden">
          <nav className="space-y-3">
            {menu.map((item) => (
              <div key={item.id} className="space-y-1">
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-xs font-bold text-[#1b2a24]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setOpenMobileSectionId((current) => (current === item.id ? null : item.id))}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-[#1b2a24]"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition ${openMobileSectionId === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileSectionId === item.id && item.groups && (
                      <div className="ml-3 space-y-1 border-l border-[#e5eae7] pl-3">
                        {item.groups.flatMap((group) => group.items).map((destination) => (
                          <Link
                            key={destination.id}
                            href={destination.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-1.5 text-xs text-[#6b7c74]"
                          >
                            {destination.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* 2. BODY AREA (BELOW TOP NAVBAR): SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Left Collapsible Sidebar (Below Header) */}
        <aside
          ref={sidebarRef}
          className={`sticky top-16 z-30 hidden h-[calc(100vh-64px)] shrink-0 flex-col justify-between border-r border-[#e5eae7] bg-white transition-all duration-200 shadow-[1px_0_4px_rgba(27,42,36,0.03)] min-[1080px]:flex ${
            isSidebarCollapsed ? 'w-14 items-center px-1.5 py-4' : 'w-60 px-3 py-4'
          }`}
          aria-label="Navigasi pintas dashboard"
        >
          {/* Toggle Button in OpenBoxes Style (rectangular tab, positioned cleanly at right border) */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            title={isSidebarCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
            className="absolute -right-3 top-3.5 z-30 flex h-6 w-5 items-center justify-center rounded-md bg-[#607268] text-white shadow-sm transition hover:bg-[#2d6a4f]"
          >
            <ChevronLeft className={`h-3 w-3 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* 2 Dashboards List */}
          <div className="w-full">
            {isSidebarCollapsed ? (
              <nav className="flex w-full flex-col items-center gap-1.5" aria-label="Dashboard switcher">
                {DASHBOARD_SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closePopovers}
                      title={item.label}
                      aria-label={item.label}
                      className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                        active
                          ? 'bg-[#eef7f2] font-bold text-[#2d6a4f] shadow-sm'
                          : 'text-[#6b7c74] hover:bg-[#f3f7f5] hover:text-[#1b2a24]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <nav className="w-full space-y-1.5 pr-2" aria-label="Dashboard switcher">
                {DASHBOARD_SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={closePopovers}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                        active
                          ? 'border-l-[3px] border-[#2d6a4f] bg-[#eef7f2] font-bold text-[#2d6a4f]'
                          : 'border-l-[3px] border-transparent text-[#6b7c74] hover:bg-[#f3f7f5] hover:text-[#1b2a24]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Bottom Area: Help & Logout */}
          <div className="relative w-full">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Bantuan"
                  aria-expanded={isHelpOpen}
                  onClick={() => {
                    closePopovers();
                    setIsHelpOpen((open) => !open);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl text-[#9ca8a2] transition hover:bg-[#f1f5f3] hover:text-[#1b2a24]"
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Keluar"
                  className="grid h-9 w-9 place-items-center rounded-xl text-[#ef4444] transition hover:bg-[#fef2f2]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1 border-t border-[#edf1ee] pt-2">
                <button
                  type="button"
                  aria-label="Bantuan"
                  aria-expanded={isHelpOpen}
                  onClick={() => {
                    closePopovers();
                    setIsHelpOpen((open) => !open);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#6b7c74] transition hover:bg-[#f1f5f3] hover:text-[#1b2a24]"
                >
                  <CircleHelp className="h-4 w-4 shrink-0 text-[#9ca8a2]" />
                  <span>Bantuan</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Keluar"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#ef4444] transition hover:bg-[#fef2f2]"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            {isHelpOpen && (
              <div className="absolute bottom-12 left-full z-50 ml-2 w-64 rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
                <p className="text-xs font-bold text-[#1b2a24]">Bantuan SIGMA</p>
                <p className="mt-1 text-[10px] leading-4 text-[#6b7c74]">
                  Gunakan menu di navbar atas untuk berpindah modul, dan sidebar di samping untuk berpindah antara Dashboard Operasional &amp; Transaction Management.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

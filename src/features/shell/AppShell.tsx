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
  ChevronRight,
  CircleHelp,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Plus,
  Repeat2,
  Search,
  Settings2,
  ShoppingCart,
  TrendingUp,
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

function firstMenuHref(item?: MenuItem) {
  return item?.href ?? item?.groups?.[0]?.items[0]?.href;
}

function getInitials(name?: string) {
  if (!name) return 'US';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function allDestinations(menu: MenuItem[]) {
  return menu.flatMap((item) => item.groups?.flatMap((group) => group.items) ?? []);
}

function findDestination(destinations: MenuDestination[], ids: string[]) {
  return ids.map((id) => destinations.find((item) => item.id === id)).find(Boolean);
}

interface DashboardNotificationSummary {
  lowStockCount: number;
  stockoutCount: number;
  pendingRequisitionsCount: number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, role, menu, logout } = useAuth();
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

  const destinations = useMemo(() => allDestinations(menu), [menu]);
  const quickAction = useMemo(() => findDestination(destinations, [
    'outbound-requisition-create',
    'purchasing-create',
    'products-create',
  ]), [destinations]);

  const shortcutItems = useMemo(() => {
    const transactionOverview = destinations.find((destination) => destination.id === 'transaction-overview');
    const candidates = [
      { item: menu.find((entry) => entry.id === 'dashboard'), icon: LayoutDashboard, label: 'Dashboard' },
      { item: menu.find((entry) => entry.id === 'inventory'), icon: Boxes, label: 'Inventory', href: '/inventory/overview' },
      { item: menu.find((entry) => entry.id === 'outbound') ?? menu.find((entry) => entry.id === 'purchasing'), icon: Repeat2, label: 'Transaksi', href: transactionOverview?.href },
      { item: menu.find((entry) => entry.id === 'reporting'), icon: TrendingUp, label: 'Fill rate' },
    ];
    return candidates.flatMap((candidate) => {
      const href = candidate.href ?? firstMenuHref(candidate.item);
      return href ? [{ ...candidate, href }] : [];
    });
  }, [destinations, menu]);
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
  });

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
    <div className="flex min-h-screen bg-[#f8faf9] text-[#1b2a24]">
      <aside ref={sidebarRef} className="sticky top-0 z-50 hidden h-screen w-20 shrink-0 flex-col items-center justify-between border-r border-[#e5eae7] bg-white py-6 shadow-[1px_0_4px_rgba(27,42,36,0.03)] min-[1180px]:flex" aria-label="Navigasi pintas">
        <div className="flex w-full flex-col items-center gap-6 px-3">
          {quickAction ? (
            <Link href={quickAction.href} onClick={closePopovers} title={quickAction.label} aria-label={quickAction.label} className="group grid h-12 w-12 place-items-center rounded-2xl bg-[#1b2a24] text-white shadow-md transition hover:bg-[#2d6a4f]">
              <Plus className="h-6 w-6" />
            </Link>
          ) : (
            <span title="Tidak ada aksi yang tersedia" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5eae7] text-[#9ca8a2]"><Plus className="h-6 w-6" /></span>
          )}
          <span className="h-px w-8 bg-[#e5eae7]" />
          <nav className="flex w-full flex-col items-center gap-3">
            {shortcutItems.map(({ item, href, icon: Icon, label }) => {
              const active = isRouteActive(pathname, href) || (item ? currentActiveMenuId === item.id : false);
              return (
                <Link key={`${label}-${href}`} href={href} onClick={closePopovers} title={label} aria-label={label} aria-current={active ? 'page' : undefined} className={`grid h-12 w-12 place-items-center rounded-2xl transition ${active ? 'bg-[#e8f5e9] text-[#2d6a4f] shadow-sm' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#2d6a4f]'}`}>
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative flex w-full flex-col items-center gap-4 px-3">
          <button type="button" aria-label="Bantuan" aria-expanded={isHelpOpen} onClick={() => { closePopovers(); setIsHelpOpen((open) => !open); }} className="grid h-12 w-12 place-items-center rounded-2xl text-[#9ca8a2] transition hover:bg-[#f1f5f3] hover:text-[#1b2a24]"><CircleHelp className="h-5 w-5" /></button>
          {isHelpOpen && (
            <div className="absolute bottom-16 left-[calc(100%+8px)] w-64 rounded-2xl border border-[#e5eae7] bg-white p-4 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
              <p className="text-xs font-bold text-[#1b2a24]">Bantuan SIGMA</p>
              <p className="mt-1 text-[10px] leading-4 text-[#6b7c74]">Gunakan menu di atas untuk berpindah modul. Tekan Ctrl/Cmd + K untuk mencari produk.</p>
            </div>
          )}
          <button type="button" onClick={() => void handleLogout()} aria-label="Keluar" className="grid h-12 w-12 place-items-center rounded-2xl text-[#ef4444] transition hover:bg-[#fef2f2]"><LogOut className="h-5 w-5" /></button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-[#e5eae7] bg-white/95 backdrop-blur-md">
          <div ref={desktopPopoverRef} className="relative mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-8">
            <Link href="/dashboard" className="font-display text-base font-extrabold text-[#1b2a24] min-[1180px]:hidden">SIGMA</Link>
            <nav aria-label="Navigasi utama" className="hidden items-center gap-1 min-[1180px]:flex">
              {menu.map((item) => {
                const Icon = NAV_ICONS[item.id] || LayoutDashboard;
                const active = currentActiveMenuId === item.id;
                const currentActiveDestinationId = activeDestinationId(pathname, searchParams, item);
                const hasChildren = Boolean(item.groups?.length);
                const triggerClass = `flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] ${active || openMenuId === item.id ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#1b2a24]'}`;

                if (!hasChildren && item.href) {
                  return <Link key={item.id} href={item.href} onClick={closePopovers} aria-current={active ? 'page' : undefined} className={triggerClass}><Icon className="h-3.5 w-3.5" />{item.label}</Link>;
                }

                return (
                  <div key={item.id} className="relative">
                    <button type="button" aria-expanded={openMenuId === item.id} aria-controls={`nav-popover-${item.id}`} onClick={() => { setIsProfileOpen(false); setIsNotificationsOpen(false); setOpenMenuId((current) => current === item.id ? null : item.id); }} className={triggerClass}>
                      <Icon className="h-3.5 w-3.5" />{item.label}<ChevronDown className={`h-3 w-3 opacity-60 transition-transform ${openMenuId === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openMenuId === item.id && item.groups && (
                      <div id={`nav-popover-${item.id}`} className="absolute left-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14),0_4px_10px_-2px_rgba(27,42,36,0.06)]">
                        {item.groups.map((group, groupIndex) => (
                          <section key={group.id} className={`${groupIndex > 0 ? 'mt-2.5 border-t border-[#edf1ee] pt-2.5' : ''}`} aria-labelledby={`popover-group-${group.id}`}>
                            <h2 id={`popover-group-${group.id}`} className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca8a2]"><Folder className="h-3 w-3 text-[#2d6a4f]" />/{group.label}</h2>
                            <div className="mt-1 space-y-0.5">
                              {group.items.map((destination) => (
                                <Link key={destination.id} href={destination.href} onClick={closePopovers} aria-current={currentActiveDestinationId === destination.id ? 'page' : undefined} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition ${currentActiveDestinationId === destination.id ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#31483c] hover:bg-[#f1f5f3] hover:text-[#2d6a4f]'}`}>
                                  <span className="truncate">{destination.label}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
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

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <div ref={searchPopoverRef} className="relative">
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
                    onFocus={() => {
                      closePopovers();
                      setIsSearchOpen(true);
                    }}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setIsSearchOpen(true);
                    }}
                    className="h-9 w-[132px] rounded-full border border-[#2d6a4f] bg-white pl-9 pr-9 text-[10px] font-medium text-[#1b2a24] outline-none transition placeholder:text-[#a1ada7] hover:bg-[#fbfdfc] focus-visible:outline-none focus-visible:ring-0 sm:w-[240px] sm:text-[11px] [&::-webkit-search-cancel-button]:hidden"
                  />
                  <kbd className="pointer-events-none absolute right-2 top-1/2 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded border border-[#e1e7e3] bg-[#f7f9f8] px-1 text-[9px] font-bold text-[#8b9a92]">K</kbd>
                </form>

                {isSearchOpen && (
                  <div id="global-search-results" role="region" aria-label="Quick search results" className="absolute right-0 top-full z-50 mt-2 w-[312px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#e5eae7] bg-white shadow-[0_14px_32px_rgba(27,42,36,0.16)]">
                    <div className="flex items-center justify-between border-b border-[#edf1ee] px-3.5 py-3">
                      <strong className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#9aa8a1]">Quick Search &amp; Results</strong>
                      <span className="text-[9px] font-bold text-[#2d6a4f]">{searchResults.length} results</span>
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="max-h-72 space-y-0.5 overflow-y-auto p-2">
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            href={result.href}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#f1f5f3]"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f5e9] text-[#2d6a4f]"><Search className="h-3.5 w-3.5" /></span>
                            <span className="min-w-0"><strong className="block truncate text-[11px] text-[#1b2a24]">{result.label}</strong><small className="block truncate text-[9px] text-[#8b9a92]">{result.description ?? result.href}</small></span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-7 text-center text-[11px] font-medium text-[#a1ada7]">
                        {searchQuery.trim() ? 'No matching modules or data found.' : 'Start typing to search modules or data.'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <button type="button" aria-label="Notifikasi" aria-expanded={isNotificationsOpen} onClick={() => { setOpenMenuId(null); setIsProfileOpen(false); setIsSearchOpen(false); setIsNotificationsOpen((open) => !open); }} className={`relative grid h-9 w-9 place-items-center rounded-full transition ${isNotificationsOpen ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#1b2a24]'}`}>
                  <Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ef5350] ring-2 ring-white" />
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
                    <div className="flex items-center justify-between px-2 py-1"><strong className="text-xs text-[#1b2a24]">Notifikasi Operasional</strong><Link href="/inventory" onClick={() => setIsNotificationsOpen(false)} className="text-[9px] font-bold text-[#2d6a4f]">Lihat semua</Link></div>
                    <div className="mt-2 divide-y divide-[#edf1ee]">
                      <Link href="/inventory?status=OUT_OF_STOCK" onClick={() => setIsNotificationsOpen(false)} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-[#f8faf9]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ef6f68]" /><span><strong className="block text-[10px] text-[#1b2a24]">{notificationSummary?.stockoutCount ?? '—'} SKU stok habis</strong><small className="text-[9px] text-[#6b7c74]">Butuh tindak lanjut segera</small></span></Link>
                      <Link href="/inventory?status=LOW_STOCK" onClick={() => setIsNotificationsOpen(false)} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-[#f8faf9]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e6a84d]" /><span><strong className="block text-[10px] text-[#1b2a24]">{notificationSummary?.lowStockCount ?? '—'} SKU stok menipis</strong><small className="text-[9px] text-[#6b7c74]">Periksa rekomendasi reorder</small></span></Link>
                      <Link href="/requisitions?status=SUBMITTED" onClick={() => setIsNotificationsOpen(false)} className="flex gap-3 rounded-lg px-2 py-3 hover:bg-[#f8faf9]"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#7caee8]" /><span><strong className="block text-[10px] text-[#1b2a24]">{notificationSummary?.pendingRequisitionsCount ?? '—'} permintaan menunggu</strong><small className="text-[9px] text-[#6b7c74]">Review dan setujui permintaan</small></span></Link>
                    </div>
                  </div>
                )}
              </div>

              <span className="hidden h-6 w-px bg-[#e5eae7] sm:block" />
              <div className="relative">
                <button type="button" aria-label="Buka menu pengguna" aria-expanded={isProfileOpen} onClick={() => { setOpenMenuId(null); setIsNotificationsOpen(false); setIsSearchOpen(false); setIsProfileOpen((open) => !open); }} className={`flex items-center gap-2.5 rounded-full p-1 transition ${isProfileOpen ? 'bg-[#f1f5f3]' : 'hover:bg-[#f1f5f3]'}`}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(145deg,#4f8c70,#22543d)] text-[9px] font-bold text-white ring-2 ring-[#e5eae7]">{getInitials(user?.name)}</span>
                  <span className="hidden text-left min-[1320px]:block"><strong className="flex items-center gap-1 text-[10px] text-[#1b2a24]">{user?.name}<ChevronDown className="h-3 w-3 text-[#9ca8a2]" /></strong><small className="block text-[9px] text-[#9ca8a2]">{user?.id}</small></span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#e5eae7] bg-white p-3 shadow-[0_12px_32px_-4px_rgba(27,42,36,0.14)]">
                    <div className="flex items-center gap-3 rounded-xl bg-[#f8faf9] p-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#2d6a4f] text-[10px] font-bold text-white">{getInitials(user?.name)}</span><span className="min-w-0"><strong className="block truncate text-xs text-[#1b2a24]">{user?.name}</strong><small className="text-[9px] font-bold text-[#2d6a4f]">{role || 'VIEWER'} • {user?.id}</small></span></div>
                    {role === 'ADMIN' && <Link href="/config/users" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-semibold text-[#43584c] hover:bg-[#f1f5f3]"><Settings2 className="h-4 w-4" />Pengaturan teknis</Link>}
                    <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[11px] font-semibold text-[#b84d48] hover:bg-[#fff1ef]"><LogOut className="h-4 w-4" />Keluar</button>
                  </div>
                )}
              </div>

              <button type="button" aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'} aria-expanded={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((open) => !open)} className="grid h-9 w-9 place-items-center rounded-full text-[#43584c] hover:bg-[#e8f5e9] min-[1180px]:hidden">
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-[#1b2a24]/35 backdrop-blur-[2px] min-[1180px]:hidden" onMouseDown={() => setIsMobileMenuOpen(false)}>
            <aside className="flex h-full w-[min(320px,88vw)] flex-col bg-white p-5 shadow-[18px_0_48px_rgba(27,42,36,0.18)]" onMouseDown={(event) => event.stopPropagation()} aria-label="Menu mobile">
              <div className="flex items-center justify-between"><Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-display text-xl font-extrabold text-[#1b2a24]">SIGMA</Link><button type="button" aria-label="Tutup menu navigasi" onClick={() => setIsMobileMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f5f3] text-[#43584c]"><X className="h-5 w-5" /></button></div>
              {quickAction && <Link href={quickAction.href} onClick={() => setIsMobileMenuOpen(false)} className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2d6a4f] text-xs font-bold text-white"><Plus className="h-4 w-4" />{quickAction.label}</Link>}
              <nav className="mt-5 flex-1 space-y-2 overflow-y-auto">
                {menu.map((item) => {
                  const Icon = NAV_ICONS[item.id] || LayoutDashboard;
                  const active = currentActiveMenuId === item.id;
                  if (item.href) {
                    return <Link key={item.id} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-xs font-bold ${active ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#52655a] hover:bg-[#f1f5f3]'}`}><Icon className="h-4 w-4" />{item.label}</Link>;
                  }
                  const expanded = openMobileSectionId === item.id;
                  return (
                    <section key={item.id} className="overflow-hidden rounded-xl border border-[#e5eae7]">
                      <button type="button" aria-expanded={expanded} onClick={() => setOpenMobileSectionId((current) => current === item.id ? null : item.id)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-xs font-bold ${active ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#52655a]'}`}><Icon className="h-4 w-4" /><span className="flex-1">{item.label}</span><ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
                      {expanded && <div className="border-t border-[#e5eae7] bg-[#f8faf9] p-2">{item.groups?.flatMap((group) => group.items).map((destination) => <Link key={destination.id} href={destination.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-semibold text-[#52655a] hover:bg-white hover:text-[#2d6a4f]"><ChevronRight className="h-3.5 w-3.5" />{destination.label}</Link>)}</div>}
                    </section>
                  );
                })}
              </nav>
              <div className="mt-4 border-t border-[#e5eae7] pt-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#2d6a4f] text-[9px] font-bold text-white">{getInitials(user?.name)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#1b2a24]">{user?.name}</strong><small className="text-[9px] text-[#6b7c74]">{role}</small></span><button type="button" aria-label="Keluar" onClick={() => void handleLogout()} className="grid h-9 w-9 place-items-center rounded-lg text-[#ef5350] hover:bg-[#fff1ef]"><LogOut className="h-4 w-4" /></button></div>
              </div>
            </aside>
          </div>
        )}

        <main className="mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1400px] px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>

    </div>
  );
}

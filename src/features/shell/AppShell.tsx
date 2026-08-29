"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function isMenuActive(pathname: string, item: MenuItem) {
  if (item.href) return isRouteActive(pathname, item.href);
  return item.groups?.some((group) => group.items.some((destination) => isRouteActive(pathname, destination.href))) ?? false;
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

  const destinations = useMemo(() => allDestinations(menu), [menu]);
  const quickAction = useMemo(() => findDestination(destinations, [
    'outbound-requisition-create',
    'purchasing-create',
    'products-create',
  ]), [destinations]);

  const shortcutItems = useMemo(() => {
    const candidates = [
      { item: menu.find((entry) => entry.id === 'dashboard'), icon: LayoutDashboard, label: 'Dashboard' },
      { item: menu.find((entry) => entry.id === 'inventory'), icon: Boxes, label: 'Inventory' },
      { item: menu.find((entry) => entry.id === 'outbound') ?? menu.find((entry) => entry.id === 'purchasing'), icon: Repeat2, label: 'Transaksi' },
      { item: menu.find((entry) => entry.id === 'reporting'), icon: TrendingUp, label: 'Fill rate' },
    ];
    return candidates.flatMap((candidate) => {
      const href = firstMenuHref(candidate.item);
      return href ? [{ ...candidate, href }] : [];
    });
  }, [menu]);

  const closePopovers = () => {
    setOpenMenuId(null);
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsHelpOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
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
            <Link href={quickAction.href} title={quickAction.label} aria-label={quickAction.label} className="group grid h-12 w-12 place-items-center rounded-2xl bg-[#1b2a24] text-white shadow-md transition hover:bg-[#2d6a4f]">
              <Plus className="h-6 w-6" />
            </Link>
          ) : (
            <span title="Tidak ada aksi yang tersedia" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e5eae7] text-[#9ca8a2]"><Plus className="h-6 w-6" /></span>
          )}
          <span className="h-px w-8 bg-[#e5eae7]" />
          <nav className="flex w-full flex-col items-center gap-3">
            {shortcutItems.map(({ item, href, icon: Icon, label }) => {
              const active = item ? isMenuActive(pathname, item) : isRouteActive(pathname, href);
              return (
                <Link key={`${label}-${href}`} href={href} title={label} aria-label={label} aria-current={active ? 'page' : undefined} className={`grid h-12 w-12 place-items-center rounded-2xl transition ${active ? 'bg-[#e8f5e9] text-[#2d6a4f] shadow-sm' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#2d6a4f]'}`}>
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
                const active = isMenuActive(pathname, item);
                const hasChildren = Boolean(item.groups?.length);
                const triggerClass = `flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] ${active || openMenuId === item.id ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#1b2a24]'}`;

                if (!hasChildren && item.href) {
                  return <Link key={item.id} href={item.href} aria-current={active ? 'page' : undefined} className={triggerClass}><Icon className="h-3.5 w-3.5" />{item.label}</Link>;
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
                                <Link key={destination.id} href={destination.href} onClick={() => setOpenMenuId(null)} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition ${isRouteActive(pathname, destination.href) ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#31483c] hover:bg-[#f1f5f3] hover:text-[#2d6a4f]'}`}>
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
              <button
                type="button"
                aria-label="Buka pencarian global"
                onClick={() => {
                  setOpenMenuId(null);
                  setIsNotificationsOpen(false);
                  setIsProfileOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex h-9 items-center gap-2 rounded-full border border-[#e5eae7] bg-white px-2.5 text-[#6b7c74] shadow-[0_1px_3px_rgba(27,42,36,0.04)] transition hover:border-[#cfd8d3] hover:bg-[#f8faf9] hover:text-[#1b2a24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d6a4f] sm:px-3"
              >
                <Search className="h-4 w-4" />
                <span className="hidden text-[10px] font-semibold sm:inline">Cari</span>
                <kbd className="hidden rounded-md border border-[#e5eae7] bg-[#f3f6f4] px-1.5 py-0.5 text-[8px] font-bold text-[#9ca8a2] sm:inline">Ctrl K</kbd>
              </button>

              <div className="relative">
                <button type="button" aria-label="Notifikasi" aria-expanded={isNotificationsOpen} onClick={() => { setOpenMenuId(null); setIsProfileOpen(false); setIsNotificationsOpen((open) => !open); }} className={`relative grid h-9 w-9 place-items-center rounded-full transition ${isNotificationsOpen ? 'bg-[#e8f5e9] text-[#2d6a4f]' : 'text-[#6b7c74] hover:bg-[#f1f5f3] hover:text-[#1b2a24]'}`}>
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
                <button type="button" aria-label="Buka menu pengguna" aria-expanded={isProfileOpen} onClick={() => { setOpenMenuId(null); setIsNotificationsOpen(false); setIsProfileOpen((open) => !open); }} className={`flex items-center gap-2.5 rounded-full p-1 transition ${isProfileOpen ? 'bg-[#f1f5f3]' : 'hover:bg-[#f1f5f3]'}`}>
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
                  const active = isMenuActive(pathname, item);
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

      {isSearchOpen && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[#1b2a24]/40 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={() => setIsSearchOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="global-search-title" className="w-full max-w-xl rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_28px_80px_rgba(27,42,36,0.24)]" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="global-search-title" className="sr-only">Pencarian global</h2>
            <form onSubmit={handleSearchSubmit} className="relative" role="search">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca8a2]" />
              <input id="global-search-input" autoFocus type="search" placeholder="Cari produk, SKU, atau menu..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-13 w-full rounded-full border border-[#cfd8d3] bg-[#f8faf9] pl-12 pr-12 text-xs font-medium text-[#1b2a24] outline-none transition placeholder:text-[#9ca8a2] focus:border-[#52b788] focus:bg-white focus:ring-4 focus:ring-[#e8f5e9] sm:text-sm" />
              <button type="button" aria-label="Tutup pencarian" onClick={() => setIsSearchOpen(false)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[#9ca8a2] hover:bg-[#f1f5f3] hover:text-[#1b2a24]"><X className="h-4 w-4" /></button>
            </form>
            <p className="px-3 pt-3 text-[10px] text-[#9ca8a2]">Tekan ESC atau klik area luar untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
}

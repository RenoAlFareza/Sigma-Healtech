"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { useActiveLocation } from './ActiveLocationContext';
import { Button, StatusBadge } from '@/shared/ui';
import { locations as allLocations } from '@/api/_fixtures/users';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, locationIds, menu, logout } = useAuth();
  const { activeLocationId, setActiveLocationId } = useActiveLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keyboard shortcut Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('global-search-input');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const userLocations = allLocations.filter((loc) => locationIds.includes(loc.id));
  const showLocationSwitcher = locationIds.length > 1;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-neutral-50)] text-[var(--color-text-main)]">
      {/* Topbar Banner */}
      <header className="sticky top-0 z-30 bg-[var(--color-brand)] text-white border-b border-[var(--color-core-800)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-[var(--radius-sm)]"
            >
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center font-bold text-white tracking-wider shadow-xs">
                Σ
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg leading-tight tracking-tight group-hover:text-[var(--color-core-200)] transition-colors">
                  SIGMA
                </span>
                <span className="text-[10px] text-[var(--color-core-300)] uppercase tracking-wider font-semibold">
                  Health Supply
                </span>
              </div>
            </Link>

            {/* Breadcrumb Context indicator */}
            <div className="hidden md:flex items-center text-xs text-[var(--color-core-300)] border-l border-[var(--color-core-700)] pl-4">
              <span className="capitalize">{pathname === '/dashboard' ? 'Overview' : pathname.replace('/', '')}</span>
            </div>
          </div>

          {/* Global Quick Search */}
          <div className="flex-1 max-w-md hidden sm:block">
              <form onSubmit={handleSearchSubmit} className="relative" role="search">
                <input
                  id="global-search-input"
                  type="search"
                  placeholder="Cari produk, SKU, atau menu... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-14 bg-[var(--color-core-900)] text-white placeholder-[var(--color-core-300)] text-xs border border-[var(--color-core-700)] rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
                />
              <svg 
                className="w-4 h-4 text-[var(--color-core-300)] absolute left-2.5 top-2.5 pointer-events-none" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <kbd className="absolute right-2 top-2 px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-core-300)] bg-[var(--color-core-800)] border border-[var(--color-core-700)] rounded pointer-events-none">
                Ctrl K
              </kbd>
            </form>
          </div>

          {/* Right Actions: Location Switcher + User Info + Logout */}
          <div className="flex items-center gap-3">
            {/* Location Switcher dropdown (rendered only if multi-location) */}
            {showLocationSwitcher && (
              <div className="flex items-center gap-1.5 bg-[var(--color-core-900)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-core-700)]">
                <svg className="w-3.5 h-3.5 text-[var(--color-accent-light)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select
                  aria-label="Lokasi Aktif"
                  value={activeLocationId || ''}
                  onChange={(e) => setActiveLocationId(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {userLocations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-[var(--color-brand)] text-white">
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Profile Info */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 border-l border-[var(--color-core-700)] pl-3">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white leading-tight">{user.name}</span>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-core-800)] text-[var(--color-core-200)] border border-[var(--color-core-700)]">
                      {role || 'VIEWER'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-white border-[var(--color-core-700)] hover:bg-[var(--color-core-800)] hover:text-white text-xs"
              aria-label="Keluar dari akun"
            >
              Keluar
            </Button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-1.5 rounded-[var(--radius-sm)] border border-[var(--color-core-700)] text-white hover:bg-[var(--color-core-800)]"
              aria-label="Buka menu navigasi"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mega-menu / Navigation Bar */}
      <nav 
        aria-label="Main Navigation"
        className="bg-white border-b border-[var(--color-neutral-200)] shadow-xs sticky top-16 z-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            {menu.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
                    isActive
                      ? 'bg-[var(--color-brand)] text-white shadow-xs'
                      : 'text-[var(--color-text-main)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-brand)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile responsive accordion menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden py-3 space-y-1.5 border-t border-[var(--color-neutral-200)]">
              {menu.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium ${
                      isActive
                        ? 'bg-[var(--color-brand)] text-white font-semibold'
                        : 'text-[var(--color-text-main)] hover:bg-[var(--color-neutral-100)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-neutral-200)] bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[var(--color-text-muted)]">
          SIGMA System &copy; {new Date().getFullYear()} Atria Banner Health. Rantai Pasok Medical Grade System.
        </div>
      </footer>
    </div>
  );
}

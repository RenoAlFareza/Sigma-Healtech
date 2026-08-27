"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Input, Card } from '@/shared/ui';

export function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Login gagal. Periksa kembali kredensial anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = (demoUser: string) => {
    setUsername(demoUser);
    setPassword('demo');
  };

  const loading = authLoading || isSubmitting;

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[var(--color-neutral-50)] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--color-core-100)] text-[var(--color-brand)] font-semibold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
            Medical Supply Chain System
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[var(--color-brand)] tracking-tight">
            SIGMA System
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sistem Informasi Logistik & Rantai Pasok Farmasi
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-[var(--shadow-card)] border-[var(--color-neutral-200)] p-6 sm:p-8 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] border-b border-[var(--color-neutral-200)] pb-3">
              Masuk ke Akun Anda
            </h2>

            {errorMessage && (
              <div 
                role="alert" 
                className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-error-light)] border border-[var(--color-error)] text-[var(--color-error)] text-sm flex items-start gap-2.5"
              >
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                id="username"
                label="Nama Pengguna"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />

              <Input
                id="password"
                type="password"
                label="Kata Sandi"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full justify-center py-2.5 font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Quick Demo Login Credentials Section */}
          <div className="mt-8 pt-6 border-t border-[var(--color-neutral-200)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Akun Demo Quick Login (Pass: demo)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { name: 'Admin', role: 'ADMIN', username: 'admin' },
                { name: 'Manager', role: 'MANAGER', username: 'manager' },
                { name: 'Staff', role: 'ASSISTANT', username: 'staff' },
                { name: 'Apoteker', role: 'PHARMACIST', username: 'pharmacist' },
                { name: 'Perawat', role: 'REQUESTOR', username: 'nurse' },
                { name: 'Buyer', role: 'BUYER', username: 'buyer' },
              ].map((demo) => (
                <button
                  key={demo.username}
                  type="button"
                  onClick={() => handleDemoClick(demo.username)}
                  className="p-2 text-left rounded-[var(--radius-sm)] border border-[var(--color-neutral-200)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors focus-visible:outline-none"
                >
                  <div className="font-semibold text-[var(--color-brand)]">{demo.username}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">{demo.name} ({demo.role})</div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Atria Health Platform &bull; SIGMA F3 Phase
        </p>
      </div>
    </div>
  );
}

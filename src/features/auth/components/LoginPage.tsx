"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { 
  ShieldCheck, 
  ClipboardCheck, 
  FileText, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 p-2 sm:p-4 lg:p-8">
      {/* Outer Card Container */}
      <div className="w-full max-w-6xl min-h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-neutral-200/80">
        
        {/* LEFT PANEL: Hijau Brand Flat (#169d60 / Button Hover Green) */}
        <div className="lg:col-span-5 bg-[#169d60] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative">
          {/* Top Branding Section (Logo Removed from Green Panel) */}
          <div className="relative z-10 space-y-4">
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Rantai Pasok & Logistik Farmasi
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Workspace operasional SIGMA Healtech
              </h1>
            </div>
          </div>

          {/* Middle Operational Feature Cards */}
          <div className="relative z-10 space-y-3 my-6">
            {/* Feature 1 */}
            <div className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-white">Akses internal</h3>
                  <p className="text-[11px] text-emerald-50 leading-relaxed">
                    Masuk aman untuk tim & staf berwenang.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-white">Workflow terpantau</h3>
                  <p className="text-[11px] text-emerald-50 leading-relaxed">
                    Pergerakan persediaan & permintaan terpantau.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-white">Dokumen tersentral</h3>
                  <p className="text-[11px] text-emerald-50 leading-relaxed">
                    Katalog produk KFA & data persediaan tersimpan rapi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="relative z-10 text-[11px] text-emerald-100/80 pt-2 border-t border-white/20">
            SIGMA Supply Chain Management &bull; Medical Logistics System
          </div>
        </div>

        {/* RIGHT PANEL: Formulir Masuk Clean White */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between">
          <div className="w-full max-w-md mx-auto space-y-6">
            
            {/* Header with Logo Restored */}
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center justify-center">
                <Image 
                  src="/logo_sigma_cropped.png" 
                  alt="SIGMA Healtech Logo" 
                  width={220} 
                  height={55} 
                  className="h-10 sm:h-11 w-auto object-contain"
                  priority
                />
              </div>

              <div className="pt-1">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1b4332] tracking-tight">
                  Masuk ke akun Anda
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  Gunakan akun internal untuk mengakses dashboard rantai pasok.
                </p>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div 
                role="alert" 
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-semibold text-neutral-700">
                  Nama Pengguna <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="admin@sigma.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full h-11 px-3.5 bg-neutral-50/70 border border-neutral-300 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#1eab6b] focus:ring-2 focus:ring-[#1eab6b]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-semibold text-neutral-700">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); alert('Hubungi administrator sistem untuk mereset kata sandi Anda.'); }}
                    className="text-xs font-medium text-[#1eab6b] hover:text-[#169d60] hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full h-11 pl-3.5 pr-10 bg-neutral-50/70 border border-neutral-300 rounded-xl text-sm text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-[#1eab6b] focus:ring-2 focus:ring-[#1eab6b]/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox: Ingat saya */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-[#1eab6b] focus:ring-[#1eab6b] accent-[#1eab6b] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-neutral-600 select-none cursor-pointer">
                  Ingat saya
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-[#1eab6b] hover:bg-[#169d60] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Section */}
            <div className="pt-4 border-t border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Akun Demo Quick Login (Pass: demo)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className="p-2 text-left rounded-xl border border-neutral-200 hover:border-[#1eab6b] hover:bg-emerald-50/60 transition-all focus-visible:outline-none group"
                  >
                    <div className="font-bold text-xs text-[#169d60] group-hover:text-[#1eab6b]">
                      {demo.username}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {demo.name} ({demo.role})
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Footer Link */}
            <div className="text-center pt-2 text-xs text-neutral-500">
              Belum punya akun?{' '}
              <a 
                href="#register" 
                onClick={(e) => { e.preventDefault(); alert('Pendaftaran akun internal dilakukan oleh Administrator.'); }}
                className="font-semibold text-[#1eab6b] hover:text-[#169d60] hover:underline"
              >
                Daftar
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


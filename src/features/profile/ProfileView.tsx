"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User as UserIcon, 
  Shield, 
  Building2, 
  KeyRound, 
  Bell, 
  Activity, 
  CheckCircle2, 
  MapPin, 
  Sliders, 
  Lock, 
  Save, 
  LogOut,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import type { Role } from '@/shared/types/domain';

const ROLE_LABEL_MAP: Record<Role, { name: string; color: string; desc: string }> = {
  ADMIN: { name: 'System Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Akses penuh ke seluruh konfigurasi sistem, pengguna, dan transaksi.' },
  MANAGER: { name: 'Manager Logistik', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Manajemen pergerakan stok, approval permintaan, dan laporan analitik.' },
  PHARMACIST: { name: 'Apoteker Penanggung Jawab', color: 'bg-teal-100 text-teal-800 border-teal-200', desc: 'Pengelolaan obat, kontrol FEFO, dan verifikasi permintaan unit.' },
  ASSISTANT: { name: 'Asisten Apoteker / Staf Gudang', color: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Penerimaan barang, putaway, picking, dan pengeluaran fisik stok.' },
  BUYER: { name: 'Procurement / Buyer', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Pembuatan dan pemantauan Purchase Order (PO) ke supplier.' },
  REQUESTOR: { name: 'Pengaju Permintaan Unit', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', desc: 'Pengajuan kebutuhan obat & BMHP dari ruang/depo ke gudang.' },
  VIEWER: { name: 'Peninjau (Read Only)', color: 'bg-neutral-100 text-neutral-700 border-neutral-200', desc: 'Akses membaca laporan dan kondisi persediaan stok.' },
};

function getInitials(name?: string) {
  if (!name) return 'US';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function ProfileView() {
  const { user, role, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preference Toggles
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyRequisition, setNotifyRequisition] = useState(true);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  const roleInfo = role ? ROLE_LABEL_MAP[role] : ROLE_LABEL_MAP.VIEWER;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Semua bidang kata sandi wajib diisi.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setPasswordStatus({ type: 'success', message: 'Kata sandi berhasil diperbarui!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSavePreferences = () => {
    setPrefSaveSuccess(true);
    setTimeout(() => setPrefSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#1eab6b] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#52b788]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-white shadow-inner">
                {getInitials(user?.name)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#1b4332] flex items-center justify-center" title="Akun Aktif">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {user?.name || 'Staf SIGMA'}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${roleInfo.color}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {roleInfo.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-emerald-100/90 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserIcon className="w-4 h-4 text-[#74c69d]" />
                  ID: <span className="font-semibold text-white">{user?.id || 'US-001'}</span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-[#74c69d]" />
                  Lokasi Utama: <span className="font-semibold text-white">{user?.defaultLocationId || 'GUDANG-UTAMA'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Quick Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all hover:border-red-400/40"
            >
              <LogOut className="w-4 h-4 text-red-300" />
              Keluar Akun
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'info'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Informasi Profil
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'security'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          Keamanan & Preferensi
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'activity'
              ? 'bg-[#1b4332] text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Riwayat Aktivitas
        </button>
      </div>

      {/* TAB CONTENT 1: INFORMASI PROFIL */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-base text-[#1b4332] flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#2d6a4f]" />
                  Detail Identitas Staf
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-neutral-500 text-[11px] font-medium block">Nama Lengkap</span>
                  <span className="font-semibold text-neutral-900 block">{user?.name || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-neutral-500 text-[11px] font-medium block">Username Login</span>
                  <span className="font-semibold text-neutral-900 block">{user?.username || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-neutral-500 text-[11px] font-medium block">ID Pengguna (NIP)</span>
                  <span className="font-semibold text-neutral-900 block">{user?.id || '—'}</span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 space-y-1">
                  <span className="text-neutral-500 text-[11px] font-medium block">Peran Sistem (Role)</span>
                  <span className="font-semibold text-emerald-800 block">{roleInfo.name}</span>
                </div>
              </div>

              {/* Assigned Locations */}
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2d6a4f]" />
                  Akses Lokasi Depo & Gudang
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(user?.locationIds && user.locationIds.length > 0 ? user.locationIds : ['GUDANG-UTAMA', 'DEPO-RAWAT-INAP', 'APOTEK-SENTRAL']).map((loc) => (
                    <span key={loc} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      loc === user?.defaultLocationId
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                    }`}>
                      <Building2 className="w-3.5 h-3.5 opacity-70" />
                      {loc}
                      {loc === user?.defaultLocationId && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md ml-1 font-semibold">Utama</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Operational Privileges */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#1b4332] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#2d6a4f]" />
                Cakupan Wewenang Modul Logistik
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {roleInfo.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-950">Akses Inventory & Stock Opname</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-950">Permintaan Requisition & Mutasi</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-950">Laporan Expiry & Fill Rate</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-950">Penerimaan & Putaway Inbound</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="lg:col-span-5 space-y-6">
            {/* Account Status Card */}
            <div className="p-6 rounded-2xl bg-neutral-900 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#52b788]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#52b788] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Status Keamanan Akun
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                    Aktif & Valid
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">Sesi Otentikasi SIGMA</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Akun terhubung secara terenkripsi menggunakan kredensial internal rumah sakit.
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Terakhir Login:</span>
                    <span className="font-semibold text-white">Hari ini, 23:40 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Metode Akses:</span>
                    <span className="font-semibold text-white">Direct Internal Auth</span>
                  </div>
                </div>

                {role === 'ADMIN' && (
                  <Link
                    href="/config/users"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-xs font-semibold text-white transition-all shadow-md"
                  >
                    <Sliders className="w-4 h-4" />
                    Buka Kelola Pengguna Sistem
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#1b4332]">Pintasan Modul Favorit</h4>
              <div className="space-y-2">
                <Link href="/inventory/overview" className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-emerald-50 text-xs font-semibold text-neutral-800 transition-all border border-neutral-100 hover:border-emerald-200">
                  <span>Overview Kondisi Inventory</span>
                  <ArrowRight className="w-4 h-4 text-[#2d6a4f]" />
                </Link>
                <Link href="/requisitions" className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-emerald-50 text-xs font-semibold text-neutral-800 transition-all border border-neutral-100 hover:border-emerald-200">
                  <span>Kelola Permintaan Requisition</span>
                  <ArrowRight className="w-4 h-4 text-[#2d6a4f]" />
                </Link>
                <Link href="/fill-rate" className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 hover:bg-emerald-50 text-xs font-semibold text-neutral-800 transition-all border border-neutral-100 hover:border-emerald-200">
                  <span>Laporan Fill Rate Intelligence</span>
                  <ArrowRight className="w-4 h-4 text-[#2d6a4f]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: KEAMANAN & PREFERENSI */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Password Form */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-[#1b4332] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#2d6a4f]" />
                Ubah Kata Sandi
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Perbarui kata sandi akun internal SIGMA Healtech secara berkala.
              </p>
            </div>

            {passwordStatus && (
              <div className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 border ${
                passwordStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {passwordStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700">
                  Kata Sandi Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Masukkan kata sandi lama"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700">
                  Kata Sandi Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700">
                  Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white text-xs sm:text-sm font-semibold shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Simpan Kata Sandi
              </button>
            </form>
          </div>

          {/* Preferences */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-5">
            <div className="border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-base text-[#1b4332] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2d6a4f]" />
                Notifikasi Operasional
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Atur peringatan peringatan sistem yang dikirimkan.
              </p>
            </div>

            {prefSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Preferensi disimpan.
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-neutral-800">Alert Stok Menipis (Low Stock)</span>
                  <span className="block text-[11px] text-neutral-500">Dapatkan peringatan saat SKU mencapai batas reorder.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="w-4 h-4 accent-[#2d6a4f]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-neutral-800">Notifikasi Permintaan Unit</span>
                  <span className="block text-[11px] text-neutral-500">Pemberitahuan saat ada requisition baru diajukan.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyRequisition}
                  onChange={(e) => setNotifyRequisition(e.target.checked)}
                  className="w-4 h-4 accent-[#2d6a4f]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-neutral-800">Peringatan Risiko Expiry FEFO</span>
                  <span className="block text-[11px] text-neutral-500">Peringatan lot obat mendekati tanggal kedaluwarsa.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyExpiry}
                  onChange={(e) => setNotifyExpiry(e.target.checked)}
                  className="w-4 h-4 accent-[#2d6a4f]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              Simpan Preferensi
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: RIWAYAT AKTIVITAS */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-sm space-y-5">
          <div className="border-b border-neutral-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1b4332] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2d6a4f]" />
                Log Aktivitas Terakhir
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Catatan sesi dan transaksi yang telah Anda lakukan di sistem.
              </p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Audit Enabled
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
            <div className="relative space-y-1">
              <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#2d6a4f] ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Sesi Login Berhasil</span>
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">Hari ini, 23:40</span>
              </div>
              <p className="text-xs text-neutral-600">
                Masuk ke sistem SIGMA Healtech dari peranti terotorisasi (IP Internal Hospital Network).
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-[#52b788] ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Verifikasi Requisition Unit</span>
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">Kemarin, 14:15</span>
              </div>
              <p className="text-xs text-neutral-600">
                Meninjau daftar pengeluaran obat Depo Rawat Inap (REQ-2026-089).
              </p>
            </div>

            <div className="relative space-y-1">
              <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-neutral-400 ring-4 ring-white" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Stok Opname Rekonsiliasi</span>
                <span className="text-[10px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">28 Ags 2026, 09:30</span>
              </div>
              <p className="text-xs text-neutral-600">
                Penyelesaian hasil variance hitung fisik Gudang Utama Farmasi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, StatusBadge, Button, Skeleton } from '@/shared/ui';
import { useAuth } from '@/features/auth/AuthProvider';

interface RequestorRequisition {
  id: string;
  reqNumber: string;
  date: string;
  destination: string;
  itemsCount: number;
  status: string;
}

export function RequestorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Simulated requestor requisitions list
  const recentRequisitions: RequestorRequisition[] = [
    {
      id: 'req-001',
      reqNumber: 'REQ-2026-0801',
      date: '2026-08-07',
      destination: 'Gudang Farmasi Pusat',
      itemsCount: 5,
      status: 'PENDING_REVIEW',
    },
    {
      id: 'req-002',
      reqNumber: 'REQ-2026-0792',
      date: '2026-08-05',
      destination: 'Gudang Farmasi Pusat',
      itemsCount: 12,
      status: 'IN_TRANSIT',
    },
    {
      id: 'req-003',
      reqNumber: 'REQ-2026-0750',
      date: '2026-08-01',
      destination: 'Gudang Farmasi Pusat',
      itemsCount: 3,
      status: 'DELIVERED',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[var(--color-core-900)] text-white p-6 rounded-[var(--radius-md)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[var(--color-core-300)] font-semibold">
            Portal Unit Permintaan Obat (Requestor)
          </span>
          <h1 className="text-2xl font-heading font-bold text-white mt-1">
            Selamat datang, {user?.name || 'Perawat Unit'}
          </h1>
          <p className="text-xs text-[var(--color-core-200)] mt-1">
            Pantau status permintaan pasok obat dan penerimaan barang untuk unit ruangan anda.
          </p>
        </div>
        <Link href="/requisitions/new">
          <Button variant="primary" className="shrink-0">
            + Buat Permintaan Obat Baru
          </Button>
        </Link>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-[var(--color-alert)] bg-white">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">
            Permintaan Menunggu Approval
          </span>
          <div className="text-3xl font-bold text-[var(--color-brand)] mt-2">1</div>
        </Card>
        <Card className="p-4 border-l-4 border-[var(--color-accent)] bg-white">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">
            Dalam Pengiriman (In Transit)
          </span>
          <div className="text-3xl font-bold text-[var(--color-accent)] mt-2">1</div>
        </Card>
        <Card className="p-4 border-l-4 border-[var(--color-success)] bg-white">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">
            Selesai Diterima Bulan Ini
          </span>
          <div className="text-3xl font-bold text-[var(--color-success)] mt-2">12</div>
        </Card>
      </div>

      {/* Recent Requisitions Table / List */}
      <Card className="p-6 bg-white border border-[var(--color-neutral-200)] shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--color-neutral-200)] pb-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-main)]">
              Status Permintaan Terbaru Unit Anda
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Daftar rekapitulasi 3 permintaan obat terakhir
            </p>
          </div>
          <Link href="/requisitions" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
            Lihat Semua Permintaan &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-[var(--color-text-main)]">
            <thead className="bg-[var(--color-neutral-100)] text-[var(--color-text-muted)] uppercase font-semibold">
              <tr>
                <th className="p-3">No. Permintaan</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Tujuan Pengiriman</th>
                <th className="p-3 text-center">Jumlah SKU</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-neutral-200)]">
              {recentRequisitions.map((req) => (
                <tr key={req.id} className="hover:bg-[var(--color-neutral-50)] transition-colors">
                  <td className="p-3 font-mono font-semibold text-[var(--color-brand)]">{req.reqNumber}</td>
                  <td className="p-3">{req.date}</td>
                  <td className="p-3">{req.destination}</td>
                  <td className="p-3 text-center font-mono">{req.itemsCount}</td>
                  <td className="p-3 text-center">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  <td className="p-3 text-right">
                    <Link 
                      href={`/requisitions/${req.id}`} 
                      className="text-[var(--color-accent)] hover:underline font-semibold"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpFromLine, ChevronRight, Info } from 'lucide-react';

interface OutgoingByAgeProps {
  createdUnder4Days?: number;
  createdOver4Days?: number;
  createdOver7Days?: number;
}

export function OutgoingByAge({
  createdUnder4Days = 4,
  createdOver4Days = 0,
  createdOver7Days = 0,
}: OutgoingByAgeProps) {
  return (
    <div className="flex h-full min-h-[260px] flex-col justify-between rounded-[20px] border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
      {/* Header (Clean, without top subtitle) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4 text-[#2d6a4f]" />
            <h2 className="font-display text-base font-bold text-[#1b2a24]">
              Pergerakan Stok Keluar (Stock Out)
            </h2>
          </div>
          <span className="text-[#9ca8a2]" title="Umur antrean pemenuhan pengeluaran barang ke unit">
            <Info className="h-4 w-4" />
          </span>
        </div>

        {/* 3 Status Indicators by Age */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-[#edf1ee] rounded-xl border border-[#edf1ee] bg-[#f8faf9] py-5 text-center">
          {/* < 4 Days */}
          <Link
            href="/outbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {createdUnder4Days}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#16a34a]">
              &lt; 4 Hari (Lancar)
            </span>
          </Link>

          {/* > 4 Days */}
          <Link
            href="/outbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {createdOver4Days}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#d97706]">
              &gt; 4 Hari (Perhatian)
            </span>
          </Link>

          {/* > 7 Days */}
          <Link
            href="/outbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {createdOver7Days}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#dc2626]">
              &gt; 7 Hari (Kritis)
            </span>
          </Link>
        </div>
      </div>

      {/* Footer (Clean description + action link) */}
      <div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[11px]">
        <span className="text-[#6b7c74]">
          Monitoring kecepatan pengeluaran obat &amp; alkes ke unit layanan
        </span>
        <Link
          href="/outbound"
          className="inline-flex items-center gap-1 font-semibold text-[#2d6a4f] hover:underline"
        >
          Lihat Pengeluaran Barang
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ChevronRight, Info } from 'lucide-react';

interface IncomingByStatusProps {
  pendingCount?: number;
  shippedCount?: number;
  partiallyReceivedCount?: number;
}

export function IncomingByStatus({
  pendingCount = 8,
  shippedCount = 5,
  partiallyReceivedCount = 1,
}: IncomingByStatusProps) {
  return (
    <div className="flex h-full min-h-[260px] flex-col justify-between rounded-[20px] border border-[#e5eae7] bg-white p-6 shadow-[0_2px_8px_rgba(27,42,36,0.04)]">
      {/* Header (Clean, without top subtitle) */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-[#2d6a4f]" />
            <h2 className="font-display text-base font-bold text-[#1b2a24]">
              Pergerakan Stok Masuk (Stock In)
            </h2>
          </div>
          <span className="text-[#9ca8a2]" title="Status penerimaan barang masuk dari pesanan supplier">
            <Info className="h-4 w-4" />
          </span>
        </div>

        {/* 3 Status Indicators */}
        <div className="mt-6 grid grid-cols-3 divide-x divide-[#edf1ee] rounded-xl border border-[#edf1ee] bg-[#f8faf9] py-5 text-center">
          {/* Pending */}
          <Link
            href="/inbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {pendingCount}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#2563eb]">
              Menunggu Masuk
            </span>
          </Link>

          {/* Kirim Pemasok */}
          <Link
            href="/inbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7c3aed]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {shippedCount}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#7c3aed]">
              Kirim Pemasok
            </span>
          </Link>

          {/* Diterima Sebagian */}
          <Link
            href="/inbound"
            className="group flex flex-col items-center justify-center px-2 transition hover:opacity-80"
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48]" />
              <span className="text-[32px] font-extrabold leading-none text-[#1b2a24] tabular-nums">
                {partiallyReceivedCount}
              </span>
            </div>
            <span className="mt-2 text-xs font-semibold text-[#6b7c74] group-hover:text-[#e11d48]">
              Diterima Sebagian
            </span>
          </Link>
        </div>
      </div>

      {/* Footer (Clean description + action link) */}
      <div className="mt-4 flex items-center justify-between border-t border-[#edf1ee] pt-3 text-[11px]">
        <span className="text-[#6b7c74]">
          Monitoring proses penerimaan barang &amp; verifikasi pesanan masuk
        </span>
        <Link
          href="/inbound"
          className="inline-flex items-center gap-1 font-semibold text-[#2d6a4f] hover:underline"
        >
          Lihat Penerimaan Barang
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

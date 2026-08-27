import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inbound — SIGMA',
  description: 'Inbound receipts list.',
};

export default function InboundPage() {
  return (
    <div className="p-6">
      <p className="text-sm text-muted">Daftar penerimaan barang. Pilih satu penerimaan untuk memulai receiving/putaway.</p>
    </div>
  );
}
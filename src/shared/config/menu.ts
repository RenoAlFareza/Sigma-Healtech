import type { Role } from '@/shared/types/domain';

export interface MenuDestination {
  id: string;
  label: string;
  href: string;
  description?: string;
  readOnly?: boolean;
}

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuDestination[];
}

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  groups?: MenuGroup[];
}

interface ProtectedDestination extends Omit<MenuDestination, 'readOnly'> {
  roles: Role[];
  readOnlyRoles?: Role[];
}

interface ProtectedGroup {
  id: string;
  label: string;
  items: ProtectedDestination[];
}

interface ProtectedMenuItem extends Omit<MenuItem, 'groups'> {
  roles?: Role[];
  groups?: ProtectedGroup[];
}

const ALL_ROLES: Role[] = ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'REQUESTOR', 'BUYER', 'VIEWER'];
const INVENTORY_ROLES: Role[] = ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'BUYER', 'VIEWER'];
const REPORTING_ROLES: Role[] = ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'BUYER', 'VIEWER'];

const navigation: ProtectedMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    roles: ALL_ROLES,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    groups: [
      {
        id: 'inventory-stock',
        label: 'Persediaan',
        items: [
          {
            id: 'inventory-overview',
            label: 'Overview Inventory',
            href: '/inventory/overview',
            description: 'Visual kondisi stok dan aktivitas masuk per lokasi.',
            roles: INVENTORY_ROLES,
          },
          {
            id: 'inventory-view',
            label: 'Rincian Persediaan',
            href: '/inventory?view=details',
            description: 'Stok per produk, lot, bin, dan lokasi.',
            roles: INVENTORY_ROLES,
          },
          {
            id: 'inventory-stock-card',
            label: 'Kartu Stok & Lot',
            href: '/inventory?view=stock-card',
            description: 'Pilih produk untuk melihat lot dan audit ledger.',
            roles: INVENTORY_ROLES,
          },
          {
            id: 'inventory-reorder',
            label: 'Rekomendasi Reorder',
            href: '/inventory/reorder',
            description: 'Prioritas replenishment untuk mencegah stockout.',
            roles: INVENTORY_ROLES,
            readOnlyRoles: ['BUYER', 'VIEWER'],
          },
        ],
      },
      {
        id: 'inventory-movement',
        label: 'Pergerakan',
        items: [
          {
            id: 'inventory-transfer',
            label: 'Transfer Stok',
            href: '/transfers',
            description: 'Redistribusi stok antar-lokasi.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST'],
          },
        ],
      },
      {
        id: 'inventory-control',
        label: 'Kontrol Stok',
        items: [
          {
            id: 'inventory-cycle-count',
            label: 'Stok Opname',
            href: '/cycle-count',
            description: 'Hitung fisik, variance, dan rekonsiliasi.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT'],
          },
        ],
      },
    ],
  },
  {
    id: 'purchasing',
    label: 'Purchasing',
    groups: [
      {
        id: 'purchasing-po',
        label: 'Purchase Order',
        items: [
          {
            id: 'purchasing-list',
            label: 'Daftar Purchase Order',
            href: '/procurement',
            description: 'Pantau status pesanan dan receiving progress.',
            roles: ['ADMIN', 'MANAGER', 'BUYER', 'VIEWER'],
            readOnlyRoles: ['VIEWER'],
          },
          {
            id: 'purchasing-create',
            label: 'Buat Purchase Order',
            href: '/procurement/new',
            description: 'Mulai replenishment stok dari supplier.',
            roles: ['ADMIN', 'MANAGER', 'BUYER'],
          },
        ],
      },
    ],
  },
  {
    id: 'inbound',
    label: 'Inbound',
    groups: [
      {
        id: 'inbound-receiving',
        label: 'Penerimaan',
        items: [
          {
            id: 'inbound-list',
            label: 'Penerimaan Barang',
            href: '/inbound',
            description: 'Catat qty, lot, expiry, dan discrepancy.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'VIEWER'],
            readOnlyRoles: ['VIEWER'],
          },
          {
            id: 'inbound-putaway',
            label: 'Putaway',
            href: '/inbound/putaway',
            description: 'Tempatkan barang diterima ke bin penyimpanan.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT'],
          },
        ],
      },
    ],
  },
  {
    id: 'outbound',
    label: 'Outbound',
    groups: [
      {
        id: 'outbound-requisition',
        label: 'Permintaan Unit',
        items: [
          {
            id: 'transaction-overview',
            label: 'Transaction Management',
            href: '/transactions',
            description: 'Visual arus mutasi, throughput, status dokumen, dan audit ledger.',
            roles: INVENTORY_ROLES,
            readOnlyRoles: ['REQUESTOR', 'VIEWER'],
          },
          {
            id: 'outbound-requisition-list',
            label: 'Daftar Permintaan',
            href: '/requisitions',
            description: 'Pantau permintaan, approval, dan fulfillment.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'REQUESTOR'],
          },
          {
            id: 'outbound-requisition-create',
            label: 'Buat Permintaan',
            href: '/requisitions/create',
            description: 'Ajukan kebutuhan obat dari unit ke gudang.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'REQUESTOR'],
          },
        ],
      },
      {
        id: 'outbound-warehouse',
        label: 'Pengeluaran Gudang',
        items: [
          {
            id: 'outbound-list',
            label: 'Daftar Pengeluaran',
            href: '/outbound',
            description: 'Pantau picking, packing, dan dispatch.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT'],
          },
          {
            id: 'outbound-create',
            label: 'Buat Pengeluaran',
            href: '/outbound/new',
            description: 'Jalankan pengeluaran stok berbasis FEFO.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT'],
          },
        ],
      },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    groups: [
      {
        id: 'reporting-main',
        label: 'Laporan Utama',
        items: [
          {
            id: 'fill-rate-overview',
            label: 'Fill Rate Intelligence',
            href: '/fill-rate',
            description: 'Analisis requested, approved, issued, gap, dan service level unit.',
            roles: REPORTING_ROLES,
            readOnlyRoles: ['VIEWER'],
          },
          {
            id: 'reporting-summary',
            label: 'Ringkasan Persediaan',
            href: '/reports?type=summary',
            description: 'Ikhtisar nilai dan kuantitas stok.',
            roles: REPORTING_ROLES,
          },
          {
            id: 'reporting-expiry',
            label: 'Risiko Kedaluwarsa',
            href: '/reports?type=expiry',
            description: 'Lot yang perlu diprioritaskan dalam FEFO.',
            roles: REPORTING_ROLES,
          },
          {
            id: 'reporting-stockout',
            label: 'Risiko Stockout',
            href: '/reports?type=stockout',
            description: 'Produk kosong dan berisiko tidak tersedia.',
            roles: REPORTING_ROLES,
          },
          {
            id: 'reporting-cycle-count',
            label: 'Laporan Stok Opname',
            href: '/cycle-count/report',
            description: 'Hasil variance, adjustment, dan rekonsiliasi.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT'],
          },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    groups: [
      {
        id: 'products-master',
        label: 'Master Produk',
        items: [
          {
            id: 'products-catalog',
            label: 'Katalog Produk KFA',
            href: '/products',
            description: 'Master produk terstandar untuk transaksi.',
            roles: ['ADMIN', 'MANAGER', 'ASSISTANT', 'PHARMACIST', 'BUYER', 'VIEWER'],
          },
          {
            id: 'products-create',
            label: 'Tambah Produk',
            href: '/products/new',
            description: 'Tambahkan produk lokal ke katalog.',
            roles: ['ADMIN'],
          },
        ],
      },
    ],
  },
];

export function getMenuForRole(role: Role): MenuItem[] {
  const result: MenuItem[] = [];

  for (const item of navigation) {
    if (item.href) {
      if (item.roles?.includes(role)) {
        result.push({ id: item.id, label: item.label, href: item.href });
      }
      continue;
    }

    const groups = (item.groups ?? []).flatMap((group) => {
      const items = group.items
        .filter((destination) => destination.roles.includes(role))
        .map((destination) => ({
          id: destination.id,
          label: destination.label,
          href: destination.href,
          description: destination.description,
          readOnly: destination.readOnlyRoles?.includes(role) || undefined,
        }));

      return items.length > 0 ? [{ id: group.id, label: group.label, items }] : [];
    });

    if (groups.length > 0) {
      result.push({ id: item.id, label: item.label, groups });
    }
  }

  return result;
}

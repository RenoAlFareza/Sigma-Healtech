import { Location, User } from './types';

export const locations: Location[] = [
  {
    id: 'wh-pusat',
    name: 'Gudang Farmasi Pusat',
    code: 'GFP',
    type: 'WAREHOUSE',
  },
  {
    id: 'depo-rawat-inap',
    name: 'Depo Rawat Inap',
    code: 'DRI',
    type: 'DEPOT',
  },
  {
    id: 'depo-igd',
    name: 'Depo IGD',
    code: 'DIGD',
    type: 'DEPOT',
  },
  {
    id: 'apotek-rawat-jalan',
    name: 'Apotek Rawat Jalan',
    code: 'ARJ',
    type: 'PHARMACY',
  },
];

export const users: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrator Utama',
    role: 'ADMIN',
    defaultLocationId: 'wh-pusat',
    locationIds: ['wh-pusat', 'depo-rawat-inap', 'depo-igd', 'apotek-rawat-jalan'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-manager',
    username: 'manager',
    name: 'Manager Farmasi',
    role: 'MANAGER',
    defaultLocationId: 'wh-pusat',
    locationIds: ['wh-pusat', 'depo-rawat-inap', 'depo-igd', 'apotek-rawat-jalan'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-staff',
    username: 'staff',
    name: 'Asisten Apoteker',
    role: 'ASSISTANT',
    defaultLocationId: 'wh-pusat',
    locationIds: ['wh-pusat'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-pharmacist',
    username: 'pharmacist',
    name: 'Apoteker Rawat Inap',
    role: 'PHARMACIST',
    defaultLocationId: 'depo-rawat-inap',
    locationIds: ['depo-rawat-inap'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-nurse',
    username: 'nurse',
    name: 'Perawat Rawat Jalan',
    role: 'REQUESTOR',
    defaultLocationId: 'apotek-rawat-jalan',
    locationIds: ['apotek-rawat-jalan'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-buyer',
    username: 'buyer',
    name: 'Staf Pengadaan',
    role: 'BUYER',
    defaultLocationId: 'wh-pusat',
    locationIds: ['wh-pusat'],
    active: true,
    password: 'demo',
  },
  {
    id: 'usr-viewer',
    username: 'viewer',
    name: 'Auditor External',
    role: 'VIEWER',
    defaultLocationId: 'wh-pusat',
    locationIds: ['wh-pusat'],
    active: true,
    password: 'demo',
  },
];

export function findUserByUsername(username: string): User | undefined {
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

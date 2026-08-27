import type { Role } from '@/shared/types/domain';

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export function getMenuForRole(role: Role): MenuItem[] {
  const allItems: Record<string, MenuItem> = {
    dashboard: { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    inventory: { id: 'inventory', label: 'Inventory', href: '/inventory' },
    requisitions: { id: 'requisitions', label: 'Requisitions', href: '/requisitions' },
    outbound: { id: 'outbound', label: 'Outbound', href: '/outbound' },
    inbound: { id: 'inbound', label: 'Inbound', href: '/inbound' },
    transfers: { id: 'transfers', label: 'Transfers', href: '/transfers' },
    procurement: { id: 'procurement', label: 'Procurement', href: '/procurement' },
    products: { id: 'products', label: 'Products', href: '/products' },
    reports: { id: 'reports', label: 'Reports', href: '/reports' },
    config: { id: 'config', label: 'Config', href: '/config/users' },
  };

  switch (role) {
    case 'ADMIN':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.requisitions,
        allItems.outbound,
        allItems.inbound,
        allItems.transfers,
        allItems.procurement,
        allItems.products,
        allItems.reports,
        allItems.config,
      ];
    case 'MANAGER':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.requisitions,
        allItems.outbound,
        allItems.inbound,
        allItems.transfers,
        allItems.procurement,
        allItems.products,
        allItems.reports,
      ];
    case 'ASSISTANT':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.requisitions,
        allItems.outbound,
        allItems.inbound,
        allItems.transfers,
      ];
    case 'PHARMACIST':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.requisitions,
        allItems.transfers,
      ];
    case 'REQUESTOR':
      return [
        allItems.dashboard,
        allItems.requisitions,
      ];
    case 'BUYER':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.procurement,
        allItems.reports,
      ];
    case 'VIEWER':
      return [
        allItems.dashboard,
        allItems.inventory,
        allItems.reports,
      ];
    default:
      return [];
  }
}

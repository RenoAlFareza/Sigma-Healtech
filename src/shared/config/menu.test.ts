import { describe, expect, it } from 'vitest';
import { getMenuForRole } from './menu';

function destinationsFor(role: Parameters<typeof getMenuForRole>[0]) {
  return getMenuForRole(role).flatMap((item) => item.groups?.flatMap((group) => group.items) ?? []);
}

describe('supply-chain mega-menu configuration', () => {
  it('exposes seven primary categories for an admin', () => {
    expect(getMenuForRole('ADMIN').map((item) => item.id)).toEqual([
      'dashboard',
      'inventory',
      'purchasing',
      'inbound',
      'outbound',
      'reporting',
      'products',
    ]);
  });

  it('nests requisitions under Outbound and stock controls under Inventory', () => {
    const menu = getMenuForRole('ADMIN');
    const outboundIds = menu.find((item) => item.id === 'outbound')?.groups?.flatMap((group) => group.items.map((item) => item.id));
    const inventoryIds = menu.find((item) => item.id === 'inventory')?.groups?.flatMap((group) => group.items.map((item) => item.id));

    expect(outboundIds).toContain('outbound-requisition-list');
    expect(inventoryIds).toContain('inventory-transfer');
    expect(inventoryIds).toContain('inventory-cycle-count');
  });

  it('limits requestors to dashboard and unit requisition workflows', () => {
    const menu = getMenuForRole('REQUESTOR');
    expect(menu.map((item) => item.id)).toEqual(['dashboard', 'outbound']);
    expect(destinationsFor('REQUESTOR').map((item) => item.id)).toEqual([
      'outbound-requisition-list',
      'outbound-requisition-create',
    ]);
  });

  it('marks viewer replenishment and purchasing destinations as read-only', () => {
    const destinations = destinationsFor('VIEWER');
    expect(destinations.find((item) => item.id === 'inventory-reorder')?.readOnly).toBe(true);
    expect(destinations.find((item) => item.id === 'purchasing-list')?.readOnly).toBe(true);
    expect(destinations.some((item) => item.id === 'products-create')).toBe(false);
  });
});

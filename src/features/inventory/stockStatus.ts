import type { StockStatusType } from '@/shared/types/domain';

export interface StockStatusInput {
  qtyOnHand: number;
  expiry?: string | null;
}

export interface StockStatusConfig {
  reorderPoint?: number;
}

/** Expiry threshold in days. */
export const EXPIRING_WINDOW_DAYS = 30;

/**
 * Derive the stock status for a single stock item from its quantity and expiry.
 *
 * Priority order (per PRD §7.9): EXPIRED > EXPIRING > STOCKOUT > LOW_STOCK > IN_STOCK.
 * A missing expiry is treated as valid and does not affect the result.
 */
export function getStockStatus(
  item: StockStatusInput,
  config?: StockStatusConfig,
  now: Date = new Date()
): StockStatusType {
  const reorderPoint = config?.reorderPoint ?? 10;

  if (item.expiry) {
    const expiryMs = new Date(item.expiry).getTime();
    if (!isNaN(expiryMs)) {
      const daysUntil = Math.ceil((expiryMs - now.getTime()) / 86_400_000);
      if (daysUntil < 0) return 'EXPIRED';
      if (daysUntil <= EXPIRING_WINDOW_DAYS) return 'EXPIRING';
    }
  }

  if (item.qtyOnHand <= 0) return 'STOCKOUT';
  if (item.qtyOnHand <= reorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

/** Available-to-promise = qty on hand (reservations not modelled yet). */
export function getAvailable(item: { qtyOnHand: number }): number {
  return Math.max(0, item.qtyOnHand);
}
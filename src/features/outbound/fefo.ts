import type { InventoryItem } from '@/shared/types/domain';

/**
 * FEFO (First-Expiry-First-Out) pick allocation.
 * Given the available lots for a product in a location, allocate `qty` across
 * lots ordered by earliest expiry first, consuming each lot in full until the
 * requested quantity is satisfied.
 *
 * Returns the allocated pick lines, or an "insufficient" error when total
 * available stock is below `qty`.
 */
export function fefoPick(
  lots: Array<Pick<InventoryItem, 'lot' | 'expiry' | 'qtyOnHand' | 'bin'>>,
  qty: number,
  now: Date = new Date()
):
  | { ok: true; picks: { lot: string; bin?: string; qty: number; expiry?: string | null }[] }
  | { ok: false; error: string } {
  if (qty <= 0) return { ok: false, error: 'Quantity must be positive' };

  // Medical policy: EXCLUDE expired lots from the FEFO source. Expired stock
  // must not be picked for issue/dispatch.
  const availableLots = lots.filter((l) => !isExpired(l.expiry, now));
  const available = availableLots.reduce((sum, l) => sum + l.qtyOnHand, 0);
  if (available < qty) {
    return { ok: false, error: `Insufficient stock: available ${available}, requested ${qty}` };
  }

  const sorted = [...availableLots]
    .sort((a, b) => {
      const ea = a.expiry ? new Date(a.expiry).getTime() : Infinity;
      const eb = b.expiry ? new Date(b.expiry).getTime() : Infinity;
      return ea - eb;
    })
    .filter((l) => l.qtyOnHand > 0);

  const picks: { lot: string; bin?: string; qty: number; expiry?: string | null }[] = [];
  let remaining = qty;

  for (const lot of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lot.qtyOnHand);
    picks.push({ lot: lot.lot, bin: lot.bin, qty: take, expiry: lot.expiry });
    remaining -= take;
  }

  if (remaining > 0) {
    return { ok: false, error: 'Insufficient stock to fully satisfy request' };
  }

  return { ok: true, picks };
}

/** True when the lot's expiry is strictly before `now`. Missing expiry is not expired. */
function isExpired(expiry: string | null | undefined, now: Date): boolean {
  if (!expiry) return false;
  const t = new Date(expiry).getTime();
  if (isNaN(t)) return false;
  return t < now.getTime();
}
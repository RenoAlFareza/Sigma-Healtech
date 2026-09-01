import { getDb } from './store';
import type { InventoryItem, StockTransaction } from '@/shared/types/domain';

/**
 * Location-scoped in-memory stock model.
 *
 * The store keeps a mutable `stock` collection keyed by item id. Seed data is
 * generated from the products catalog (getDb().products) so lot/expiry/bin/qty
 * are realistic per location. Status is derived on read via getStockStatus.
 * A running `ledger` records every IN/OUT/TRANSFER movement for the stock card.
 */

interface StockState {
  items: InventoryItem[];
}

/** Result of a stock mutation. */
export type StockMutationResult =
  | { ok: true; item: InventoryItem }
  | { ok: false; error: string };

/** Helpers to build deterministic seed rows. */
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface SeedRow {
  product: { id: string; kfaCode: string; name: string; category: string };
  lot: string;
  expiryDays: number;
  qtyOnHand: number;
  bin: string;
}

/** A small curated set of lots across locations, using known KFA products. */
const seedRows: SeedRow[] = [
  // wh-pusat — Gudang Farmasi Pusat (healthy mix)
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-001', expiryDays: 320, qtyOnHand: 120, bin: 'Z-A1' },
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-105', expiryDays: 20, qtyOnHand: 40, bin: 'Z-A1' },
  { product: { id: '93015366', kfaCode: '93015366', name: 'Paracetamol 500 mg Tablet Strip', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-002', expiryDays: 400, qtyOnHand: 200, bin: 'Z-A2' },
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2025-099', expiryDays: -10, qtyOnHand: 15, bin: 'Z-A1' },
  { product: { id: '93012826', kfaCode: '93012826', name: 'Amoxicillin 500 mg Tablet', category: 'Antibiotik' }, lot: 'LOT-2026-010', expiryDays: 260, qtyOnHand: 8, bin: 'Z-B2' },
  { product: { id: '93012826', kfaCode: '93012826', name: 'Amoxicillin 500 mg Tablet', category: 'Antibiotik' }, lot: 'LOT-2026-011', expiryDays: 300, qtyOnHand: 0, bin: 'Z-B2' },
  { product: { id: '93025130', kfaCode: '93025130', name: 'Omeprazole 20 mg Kapsul', category: 'Gastrointestinal' }, lot: 'LOT-2026-020', expiryDays: 500, qtyOnHand: 60, bin: 'Z-C1' },
  { product: { id: '93008292', kfaCode: '93008292', name: 'Cefixime Sirup', category: 'Antibiotik' }, lot: 'LOT-2026-030', expiryDays: 25, qtyOnHand: 30, bin: 'Z-B3' },
  // depo-rawat-inap — Depo Rawat Inap
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-040', expiryDays: 200, qtyOnHand: 45, bin: 'W-01' },
  { product: { id: '93012826', kfaCode: '93012826', name: 'Amoxicillin 500 mg Tablet', category: 'Antibiotik' }, lot: 'LOT-2026-041', expiryDays: 180, qtyOnHand: 12, bin: 'W-02' },
  // depo-igd — Depo IGD
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-050', expiryDays: 150, qtyOnHand: 25, bin: 'I-01' },
  // apotek-rawat-jalan — Apotek Rawat Jalan
  { product: { id: '93000462', kfaCode: '93000462', name: 'Paracetamol 500 mg Tablet', category: 'Analgesik/Antipiretik' }, lot: 'LOT-2026-060', expiryDays: 90, qtyOnHand: 70, bin: 'A-01' },
];

function seedStock(): InventoryItem[] {
  const { products } = getDb();
  const byId = new Map(products.map((p) => [p.id, p]));

  // 1. Initial curated seed rows (preserves existing unit test expectations)
  const rowLocations: string[] = [
    'wh-pusat', 'wh-pusat', 'wh-pusat', 'wh-pusat', 'wh-pusat', 'wh-pusat',
    'wh-pusat', 'wh-pusat', 'depo-rawat-inap', 'depo-rawat-inap', 'depo-igd', 'apotek-rawat-jalan',
  ];

  const seeded: InventoryItem[] = seedRows.map((row, index) => {
    const product = byId.get(row.product.id) ?? {
      id: row.product.id,
      kfaCode: row.product.kfaCode,
      name: row.product.name,
      zatAktif: '',
      kekuatan: '',
      dosageForm: '',
      nie: '',
      manufacturer: '',
      price: 5000,
      uom: 'Tablet',
      category: row.product.category,
    };
    const locationId = rowLocations[index];
    return {
      id: `${product.id}-${row.lot}-${locationId}`,
      product,
      locationId,
      lot: row.lot,
      expiry: isoDaysFromToday(row.expiryDays),
      qtyOnHand: row.qtyOnHand,
      bin: row.bin,
      status: 'IN_STOCK',
    };
  });

  const seededProductIds = new Set(seedRows.filter((_, idx) => rowLocations[idx] === 'wh-pusat').map((r) => r.product.id));

  // 2. Expand up to 100 products for wh-pusat from master KFA product catalog
  const sampleKfa = products.slice(0, 100);
  sampleKfa.forEach((p, idx) => {
    if (seededProductIds.has(p.id)) return;

    let qty = 350 + ((idx * 43) % 950);
    if (idx % 10 === 0) qty = 0; // Out of stock
    else if (idx % 10 === 1) qty = 25 + (idx % 20); // Below minimum
    else if (idx % 10 === 2 || idx % 10 === 3) qty = 85 + (idx % 50); // Reorder

    const binRack = `RAK-${String.fromCharCode(65 + (idx % 6))}-${(idx % 15) + 1}`;
    const lotNum = `LOT-2026-${String(idx + 100).padStart(3, '0')}`;
    const expiryDays = 60 + ((idx * 31) % 700);

    seeded.push({
      id: `${p.id}-${lotNum}-wh-pusat`,
      product: p,
      locationId: 'wh-pusat',
      lot: lotNum,
      expiry: isoDaysFromToday(expiryDays),
      qtyOnHand: qty,
      bin: binRack,
      status: 'IN_STOCK',
    });
  });

  return seeded;
}

// Initialized after seedStock/seedRows are defined (avoids TDZ).
let state: StockState = { items: seedStock() };
let ledger: StockTransaction[] = [];

export function getStockForLocation(locationId: string): InventoryItem[] {
  return state.items.filter((i) => i.locationId === locationId);
}

export function getStockItem(productId: string, locationId: string): InventoryItem[] {
  return state.items.filter(
    (i) => i.locationId === locationId && (i.product.id === productId || i.product.kfaCode === productId)
  );
}

export function addStockItem(item: InventoryItem): void {
  state.items.push(item);
}

/** Find a stock item by location + product + lot. */
function findItem(locationId: string, productId: string, lot: string): InventoryItem | undefined {
  return state.items.find(
    (i) =>
      i.locationId === locationId &&
      lot &&
      i.lot === lot &&
      (i.product.id === productId || i.product.kfaCode === productId)
  );
}

/**
 * Reduce qtyOnHand for a specific lot. Guards against insufficient stock.
 * Records an OUT ledger entry with the running balance for that product+location.
 */
export function decrementStock(
  locationId: string,
  productId: string,
  lot: string,
  qty: number,
  user: string = 'system',
  reference?: string,
  type: StockTransaction['type'] = 'OUT'
): StockMutationResult {
  const item = findItem(locationId, productId, lot);
  if (!item) {
    return { ok: false, error: `Stock lot ${lot} not found` };
  }
  if (qty <= 0) {
    return { ok: false, error: 'Quantity must be positive' };
  }
  if (item.qtyOnHand < qty) {
    return { ok: false, error: `Insufficient stock for ${item.product.name} (${lot}): on hand ${item.qtyOnHand}, requested ${qty}` };
  }
  item.qtyOnHand -= qty;
  pushLedger({
    date: new Date().toISOString(),
    type,
    qtyOut: qty,
    balance: item.qtyOnHand,
    user,
    reference,
    productId,
    lot,
    locationId,
  });
  return { ok: true, item };
}

/**
 * Add stock to an existing lot or create a new lot row. Records an IN ledger entry.
 */
export function incrementStock(
  locationId: string,
  productId: string,
  input: { lot: string; expiry?: string; bin?: string; qty: number },
  user: string = 'system',
  reference?: string,
  type: StockTransaction['type'] = 'IN'
): StockMutationResult {
  const existing = findItem(locationId, productId, input.lot);
  if (existing) {
    existing.qtyOnHand += input.qty;
    if (input.bin) existing.bin = input.bin;
    if (input.expiry) existing.expiry = input.expiry;
    pushLedger({
      date: new Date().toISOString(),
      type,
      qtyIn: input.qty,
      balance: existing.qtyOnHand,
      user,
      reference,
      productId,
      lot: input.lot,
      locationId,
    });
    return { ok: true, item: existing };
  }

  // New lot: locate the product in the catalog.
  const { products } = getDb();
  const product = products.find((p) => p.id === productId || p.kfaCode === productId);
  if (!product) {
    return { ok: false, error: `Product ${productId} not found` };
  }
  const item: InventoryItem = {
    id: `${product.id}-${input.lot}-${locationId}`,
    product,
    locationId,
    lot: input.lot,
    expiry: input.expiry ?? null,
    qtyOnHand: input.qty,
    bin: input.bin ?? '',
    status: 'IN_STOCK',
  };
  state.items.push(item);
  pushLedger({
    date: new Date().toISOString(),
    type,
    qtyIn: input.qty,
    balance: input.qty,
    user,
    reference,
    productId,
    lot: input.lot,
    locationId,
  });
  return { ok: true, item };
}

/**
 * Running balance for a product+location, computed cumulatively from the ledger.
 */
export function getStockCardTransactions(productId: string, locationId: string): StockTransaction[] {
  return ledger
    .filter((t) => t.productId === productId && t.locationId === locationId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** All ledger entries (optionally filtered) — used by tests. */
export function getLedger(locationId?: string, productId?: string): StockTransaction[] {
  return ledger.filter(
    (t) =>
      (!locationId || t.locationId === locationId) &&
      (!productId || t.productId === productId)
  );
}

function pushLedger(tx: StockTransaction): void {
  ledger.push(tx);
}

export function resetStock(): void {
  state = { items: seedStock() };
}

export function resetLedger(): void {
  ledger = [];
}
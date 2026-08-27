import { searchProducts as searchFilter, products as defaultProducts } from './products';
import { Location, Product, User } from './types';
import { locations, users } from './users';

interface Store {
  users: User[];
  locations: Location[];
  products: Product[];
}

// Clone the imported consts so mutations never touch the imported arrays
// nor the shared `kfaProducts` generated catalog.
const cloneStore = (): Store => ({
  users: users.map((u) => ({ ...u })),
  locations: locations.map((l) => ({ ...l })),
  products: defaultProducts.map((p) => ({ ...p })),
});

let db: Store = cloneStore();

export function getDb(): Store {
  return db;
}

export function resetDb(): void {
  db = cloneStore();
}

export function getProductById(id: string): Product | undefined {
  return db.products.find((p) => p.id === id || p.kfaCode === id);
}

export function addProduct(product: Product): Product {
  const record = { ...product };
  db.products.push(record);
  return record;
}

export function updateProduct(id: string, patch: Partial<Product>): Product | undefined {
  const index = db.products.findIndex((p) => p.id === id || p.kfaCode === id);
  if (index === -1) return undefined;
  const updated = { ...db.products[index], ...patch, id: db.products[index].id };
  db.products[index] = updated;
  return updated;
}

// Search the live mutable collection so created products appear in lists.
export function searchProducts(keyword?: string, category?: string): Product[] {
  return searchFilter(keyword, category, db.products);
}

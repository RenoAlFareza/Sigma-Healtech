import { kfaProducts } from './kfa-products';
import type { Product } from '@/shared/types/domain';

// Full KFA catalog (1011 real Indonesian drugs). Kept as the canonical product source.
export const products: Product[] = kfaProducts;

export function searchProducts(
  keyword?: string,
  category?: string,
  source: Product[] = products
): Product[] {
  return source.filter((p) => {
    let match = true;

    if (keyword && keyword.trim() !== '') {
      const kw = keyword.trim().toLowerCase();
      const matchName = p.name.toLowerCase().includes(kw);
      const matchKfa = p.kfaCode.toLowerCase().includes(kw);
      const matchZat = p.zatAktif.toLowerCase().includes(kw);
      const matchNie = p.nie.toLowerCase().includes(kw);
      match = match && (matchName || matchKfa || matchZat || matchNie);
    }

    if (category && category.trim() !== '' && category !== 'ALL') {
      match = match && p.category.toLowerCase() === category.trim().toLowerCase();
    }

    return match;
  });
}

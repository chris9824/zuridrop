import type { Restaurant } from '@/lib/types';
import type { ApiRestaurant } from './schemas';

/* ── Gradient palette for restaurants without images ── */
const GRADIENTS = [
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
  'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
  'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
];

/** Deterministic pseudo-random from string (for consistent mock values) */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Adapts a backend restaurant to the UI card format.
 * Missing fields get coherent mock/fallback values.
 */
export function adaptRestaurantToCard(r: ApiRestaurant, index: number): Restaurant {
  const h = hashCode(r.id);

  return {
    id: r.id,
    name: r.name,
    image: GRADIENTS[h % GRADIENTS.length],
    rating: Math.round((40 + (h % 10)) * 10) / 100,
    ratingCount: 50 + (h % 400),
    deliveryFee: [0, 500, 600, 750, 800, 1000][h % 6],
    etaMin: 10 + (h % 25),
    tags: buildTags(r),
    isFeatured: index < 6,
    isRecommended: index >= 3,
    isOpen: r.isOpen ?? null,
    _searchText: buildSearchText(r),
  };
}

function buildTags(r: ApiRestaurant): string[] {
  const tags: string[] = [];
  if (r.city) tags.push(r.city);
  if (r.isOpen) tags.push('Ouvert');
  if (tags.length === 0) tags.push('Restaurant');
  return tags.slice(0, 2);
}

function buildSearchText(r: ApiRestaurant): string {
  const parts: string[] = [r.name];
  if (r.description) parts.push(r.description);
  if (r.city) parts.push(r.city);

  const menuItems = r.menuItems as Array<{ name?: string; category?: string; description?: string }> | null | undefined;
  if (Array.isArray(menuItems)) {
    for (const item of menuItems) {
      if (item.name) parts.push(item.name);
      if (item.category) parts.push(item.category);
      if (item.description) parts.push(item.description);
    }
  }

  return parts.join(' ').toLowerCase();
}

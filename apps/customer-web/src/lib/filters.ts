import type { Restaurant } from './types';

/**
 * Maps category IDs to search keywords.
 * A restaurant matches a category if its _searchText contains any of these keywords.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  pizza: ['pizza', 'margherita', 'pepperoni', 'fromages', 'napoli'],
  burger: ['burger', 'cheddar', 'bacon', 'steak'],
  chicken: ['poulet', 'chicken', 'yassa', 'braisé'],
  african: ['africain', 'african', 'attiéké', 'garba', 'maquis', 'jollof', 'yassa', 'braisé', 'alloco', 'ivoirien'],
  sushi: ['sushi', 'japonais', 'maki'],
  salad: ['salade', 'salad', 'healthy', 'bowl'],
  dessert: ['dessert', 'gâteau', 'glace', 'pâtisserie', 'boulangerie', 'glacer'],
  drinks: ['boisson', 'boissons', 'jus', 'coca', 'juice', 'bar', 'café'],
  grocery: ['courses', 'grocery', 'supermarché'],
  coffee: ['café', 'coffee', 'thé'],
  healthy: ['healthy', 'salade', 'bowl', 'green', 'fresh'],
};

export function filterRestaurants(
  restaurants: Restaurant[],
  category: string,
  searchTerm: string,
): Restaurant[] {
  let result = restaurants;

  // Category filter
  if (category && category !== 'all') {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords) {
      result = result.filter((r) =>
        keywords.some((kw) => r._searchText.includes(kw)),
      );
    }
  }

  // Search filter
  const q = searchTerm.trim().toLowerCase();
  if (q.length >= 2) {
    result = result.filter((r) => r._searchText.includes(q));
  }

  return result;
}

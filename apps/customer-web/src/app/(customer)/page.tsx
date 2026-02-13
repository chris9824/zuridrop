import { getRestaurants } from '@/lib/api/restaurants';
import { adaptRestaurantToCard } from '@/lib/api/adapters';
import { HomeContent } from '@/components/customer/home-content';
import type { Restaurant } from '@/lib/types';

export default async function CustomerHomePage() {
  let cards: Restaurant[] = [];
  let error: string | null = null;

  try {
    const data = await getRestaurants({ limit: 30 });
    cards = data.items.map((r, i) => adaptRestaurantToCard(r, i));
  } catch (err) {
    console.error('[Home] fetch error:', err);
    error = 'Impossible de charger les restaurants.';
  }

  const featured = cards.slice(0, 6);
  const recommended = cards.slice(3, 9);
  const all = cards;

  return (
    <HomeContent
      featured={featured}
      recommended={recommended}
      all={all}
      error={error}
    />
  );
}

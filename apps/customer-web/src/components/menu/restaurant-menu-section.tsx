'use client';

import { useMemo } from 'react';
import type { ApiMenuItem } from '@/lib/api/schemas';
import { MenuItemCard } from './menu-item-card';

interface Props {
  menuItems: ApiMenuItem[];
  restaurantId: string;
  restaurantName: string;
}

export function RestaurantMenuSection({ menuItems, restaurantId, restaurantName }: Props) {
  // Group items by category
  const grouped = useMemo(() => {
    const map = new Map<string, ApiMenuItem[]>();
    for (const item of menuItems) {
      const cat = item.category?.trim() || 'Autres';
      const arr = map.get(cat) ?? [];
      arr.push(item);
      map.set(cat, arr);
    }
    return Array.from(map.entries());
  }, [menuItems]);

  return (
    <section className="mt-8">
      <h2 className="mb-5 text-xl font-semibold tracking-tight text-foreground">Menu</h2>

      {menuItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Le menu de ce restaurant sera bientôt disponible.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-3 text-base font-semibold text-foreground">{category}</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={restaurantId}
                    restaurantName={restaurantName}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

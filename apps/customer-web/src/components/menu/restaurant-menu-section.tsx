'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiMenuItem } from '@/lib/api/schemas';
import { MenuItemCard } from './menu-item-card';

interface Props {
  menuItems: ApiMenuItem[];
  restaurantId: string;
  restaurantName: string;
  /** Disables all add-to-cart actions (restaurant closed / out of zone) */
  disabled?: boolean;
  disabledReason?: string;
}

export function RestaurantMenuSection({
  menuItems,
  restaurantId,
  restaurantName,
  disabled = false,
  disabledReason,
}: Props) {
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

  const categories = useMemo(() => grouped.map(([cat]) => cat), [grouped]);
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '');
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const scrollToCategory = useCallback((cat: string) => {
    setActiveCategory(cat);
    const el = sectionRefs.current.get(cat);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  const setSectionRef = useCallback((cat: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(cat, el);
  }, []);

  const disabledLabel = disabled
    ? (disabledReason?.includes('zone') ? 'Hors zone' : 'Fermé')
    : undefined;

  if (menuItems.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-base font-semibold text-foreground">Aucun plat disponible</p>
        <p className="text-sm text-muted-foreground">
          Le menu de ce restaurant sera bientôt disponible.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Category navigation — sticky */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/90 px-4 backdrop-blur-lg md:-mx-8 md:px-8">
          <nav
            className="flex gap-1 overflow-x-auto py-3 scrollbar-hide"
            aria-label="Catégories du menu"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Menu sections */}
      <div className="mt-6 space-y-10">
        {grouped.map(([category, items], groupIdx) => (
          <motion.section
            key={category}
            ref={(el) => setSectionRef(category, el)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIdx * 0.05 }}
          >
            <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
              {category}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                  disabled={disabled}
                  disabledLabel={disabledLabel}
                />
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

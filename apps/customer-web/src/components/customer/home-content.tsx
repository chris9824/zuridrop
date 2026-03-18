'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/customer/header';
import { CategoryRow } from '@/components/customer/category-row';
import { FilterRow } from '@/components/customer/filter-row';
import { FeaturedCarousel } from '@/components/customer/featured-carousel';
import { RestaurantGrid } from '@/components/customer/restaurant-grid';
import { MobileBottomNav } from '@/components/customer/mobile-bottom-nav';
import { AlertTriangle, UtensilsCrossed, SearchX } from 'lucide-react';
import { filterRestaurants } from '@/lib/filters';
import type { Restaurant } from '@/lib/types';

interface HomeContentProps {
  featured: Restaurant[];
  recommended: Restaurant[];
  all: Restaurant[];
  error: string | null;
}

export function HomeContent({ featured, recommended, all, error }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isFiltering = selectedCategory !== 'all' || searchTerm.trim().length >= 2;

  const filteredFeatured = useMemo(
    () => filterRestaurants(featured, selectedCategory, searchTerm),
    [featured, selectedCategory, searchTerm],
  );
  const filteredRecommended = useMemo(
    () => filterRestaurants(recommended, selectedCategory, searchTerm),
    [recommended, selectedCategory, searchTerm],
  );
  const filteredAll = useMemo(
    () => filterRestaurants(all, selectedCategory, searchTerm),
    [all, selectedCategory, searchTerm],
  );

  const isEmpty = !error && filteredAll.length === 0;
  const hasDataButFiltered = !error && all.length > 0 && filteredAll.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Sticky filter bar */}
      <div className="sticky top-[calc(var(--header-h,57px))] z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl space-y-1 px-4 py-2 md:px-6">
          <CategoryRow selected={selectedCategory} onSelect={setSelectedCategory} />
          <FilterRow />
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-7xl">
        {/* Error state */}
        {error && (
          <div className="mx-4 mt-10 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center md:mx-0">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-base font-medium text-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez que le backend est lancé sur le port 3001.
            </p>
          </div>
        )}

        {/* No data at all */}
        {!error && all.length === 0 && (
          <div className="mx-4 mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center md:mx-0">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Aucun restaurant trouvé.</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou revenez plus tard.
            </p>
          </div>
        )}

        {/* Filtering returned no results */}
        {hasDataButFiltered && (
          <div className="mx-4 mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center md:mx-0">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Aucun restaurant trouvé</p>
            <p className="text-sm text-muted-foreground">
              Essayez une autre catégorie ou modifiez votre recherche.
            </p>
            {isFiltering && (
              <button
                onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Data loaded & filtered */}
        {!error && !isEmpty && (
          <>
            {filteredFeatured.length > 0 && (
              <FeaturedCarousel restaurants={filteredFeatured} />
            )}
            <RestaurantGrid recommended={filteredRecommended} all={filteredAll} />
          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}

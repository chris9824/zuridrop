'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard, RestaurantCardSkeleton } from './restaurant-card';
import { useInView } from '@/lib/use-in-view';
import type { Restaurant } from '@/lib/types';

const CARD_W = 300;
const CARD_GAP = 16;

interface FeaturedCarouselProps {
  restaurants: Restaurant[];
  loading?: boolean;
}

export function FeaturedCarousel({ restaurants, loading = false }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { ref: sectionRef, inView } = useInView<HTMLElement>({ threshold: 0.15 });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = dir === 'left' ? -(CARD_W + CARD_GAP) : CARD_W + CARD_GAP;
    el.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  }, [updateScrollState]);

  if (!loading && restaurants.length === 0) return null;

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-6 md:mt-8"
    >
      {/* Section header */}
      <div className="mb-3 flex items-center justify-between px-4 md:px-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          À la une sur ZuriDrop
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`hidden h-8 w-8 md:inline-flex ${!canScrollLeft ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`hidden h-8 w-8 md:inline-flex ${!canScrollRight ? 'opacity-30 pointer-events-none' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <button className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline">
            Voir tout <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable carousel */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        role="region"
        aria-label="Restaurants à la une"
        className="flex gap-4 overflow-x-auto scroll-smooth px-4 scrollbar-hide md:px-0"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[280px] shrink-0 md:w-[300px]" style={{ scrollSnapAlign: 'start' }}>
                <RestaurantCardSkeleton />
              </div>
            ))
          : restaurants.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: i * 0.06, ease: 'easeOut' }}
                className="w-[280px] shrink-0 md:w-[300px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <RestaurantCard restaurant={r} variant="compact" />
              </motion.div>
            ))}
      </div>
    </motion.section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Clock, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Restaurant } from '@/lib/types';

/* ── Skeleton variant ─────────────────────────────── */
export function RestaurantCardSkeleton({ variant = 'compact' }: { variant?: 'compact' | 'wide' }) {
  const isWide = variant === 'wide';
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-card', isWide ? 'flex' : '')}>
      <Skeleton className={cn('shrink-0', isWide ? 'h-36 w-40 md:h-44 md:w-48 rounded-none' : 'aspect-[16/10] w-full rounded-b-none')} />
      <div className={cn('flex flex-1 flex-col gap-2 p-3', isWide ? 'justify-center' : '')}>
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
      </div>
    </div>
  );
}

/* ── Main card ────────────────────────────────────── */
interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: 'compact' | 'wide';
}

export function RestaurantCard({ restaurant, variant = 'compact' }: RestaurantCardProps) {
  const [liked, setLiked] = useState(false);
  const isWide = variant === 'wide';

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      aria-label={`Ouvrir le restaurant ${restaurant.name}`}
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <motion.div
        whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
        whileTap={{ scale: 0.985 }}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card',
          'shadow-sm transition-shadow duration-200',
          'hover:shadow-lg hover:shadow-black/5',
          'dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/25 dark:hover:border-border/80',
          isWide ? 'flex gap-0' : '',
        )}
      >
        {/* Image */}
        <div
          className={cn(
            'relative overflow-hidden',
            isWide ? 'h-36 w-40 shrink-0 md:h-44 md:w-48' : 'aspect-[16/10] w-full',
          )}
          style={{ background: restaurant.image }}
        >
          {/* Subtle zoom on hover */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            style={{ background: restaurant.image }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent dark:from-black/50" />

          {/* Heart button — stops navigation */}
          <motion.button
            whileTap={{ scale: 0.75 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm transition-colors hover:bg-background"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={liked ? 'liked' : 'not-liked'}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <Heart className={cn('h-4 w-4', liked ? 'fill-red-500 text-red-500' : 'text-foreground')} />
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Content */}
        <div className={cn('flex flex-1 flex-col gap-1 p-3', isWide ? 'justify-center' : '')}>
          <h3 className="text-sm font-semibold leading-tight text-foreground line-clamp-1">
            {restaurant.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-foreground">{restaurant.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({restaurant.ratingCount}+)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {restaurant.etaMin} min
            </span>
            <span className="flex items-center gap-1">
              <Bike className="h-3 w-3" />
              {restaurant.deliveryFee === 0 ? 'Gratuit' : `${restaurant.deliveryFee} F`}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {restaurant.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

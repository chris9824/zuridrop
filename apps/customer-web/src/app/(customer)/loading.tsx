import { Header } from '@/components/customer/header';
import { MobileBottomNav } from '@/components/customer/mobile-bottom-nav';
import { RestaurantCardSkeleton } from '@/components/customer/restaurant-card';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      {/* Skeleton filter bar */}
      <div className="sticky top-[calc(var(--header-h,57px))] z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-3 md:px-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl">
        {/* Skeleton carousel */}
        <section className="mt-6 md:mt-8">
          <div className="mb-3 px-4 md:px-0">
            <div className="h-7 w-56 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex gap-4 overflow-hidden px-4 md:px-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[280px] shrink-0 md:w-[300px]">
                <RestaurantCardSkeleton />
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton grid */}
        <section className="mt-8 md:mt-10">
          <div className="mb-4 px-4 md:px-0">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 md:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} variant="wide" />
            ))}
          </div>
        </section>

        <section className="mt-8 md:mt-10">
          <div className="mb-4 px-4 md:px-0">
            <div className="h-7 w-52 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 md:px-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav />
    </div>
  );
}

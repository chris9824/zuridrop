import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RestaurantDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="relative h-56 w-full animate-pulse bg-muted sm:h-64 md:h-72 lg:h-80">
        <div className="absolute left-4 top-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 text-white/50" />
          </Link>
        </div>
        <div className="absolute bottom-5 left-4 space-y-2 md:left-8">
          <div className="h-4 w-16 rounded-full bg-white/20" />
          <div className="h-8 w-64 rounded-lg bg-white/20" />
          <div className="h-4 w-32 rounded bg-white/15" />
        </div>
      </div>

      {/* Info bar skeleton */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl gap-5 px-4 py-3.5 md:px-8">
          {[80, 100, 90, 70].map((w, i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-muted" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mx-auto max-w-7xl px-4 pt-5 md:px-8">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>

      {/* Category nav skeleton */}
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <div className="flex gap-2 border-b border-border pb-3">
          {[70, 90, 60, 80].map((w, i) => (
            <div key={i} className="h-8 shrink-0 animate-pulse rounded-full bg-muted" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Menu items skeleton */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 pt-6 md:px-8">
        {[1, 2].map((group) => (
          <div key={group}>
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="hidden h-24 w-24 shrink-0 animate-pulse rounded-xl bg-muted sm:block" />
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div>
                      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="flex items-end">
                    <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Mes commandes
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* Header skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-40 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-muted" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded bg-muted" />
        </div>

        {/* Timeline skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Items skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

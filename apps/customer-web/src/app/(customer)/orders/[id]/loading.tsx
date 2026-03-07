import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Mes commandes
          </Link>
          <div className="ml-auto h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-muted" />
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="h-7 w-72 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
              </div>
              <div className="flex gap-3">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-8 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left */}
          <div className="space-y-6 lg:col-span-3">
            {/* Timeline skeleton */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 h-5 w-44 animate-pulse rounded bg-muted" />
              <div className="space-y-5">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      {i === 1 && <div className="h-3 w-48 animate-pulse rounded bg-muted" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info cards skeleton */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Summary skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 h-5 w-32 animate-pulse rounded bg-muted" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
              <div className="mt-5 space-y-2.5 border-t border-dashed border-border pt-5">
                <div className="flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <div className="h-5 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

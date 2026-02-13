import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <Skeleton className="h-48 w-full rounded-2xl md:h-64" />
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-96 rounded-md" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

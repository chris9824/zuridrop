import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Phone } from 'lucide-react';
import { getRestaurantById, NotFoundError } from '@/lib/api/restaurants';
import type { ApiRestaurant } from '@/lib/api/schemas';

interface Props {
  params: { id: string };
}

export default async function RestaurantDetailPage({ params }: Props) {
  let restaurant: ApiRestaurant | null = null;
  let error: string | null = null;
  let notFound = false;

  try {
    restaurant = await getRestaurantById(params.id);
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound = true;
    } else {
      error = 'Impossible de charger ce restaurant.';
      console.error('[RestaurantDetail]', err);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Not found */}
        {notFound && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Restaurant introuvable.</p>
            <p className="text-sm text-muted-foreground">
              Ce restaurant n&apos;existe pas ou a été supprimé.
            </p>
            <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
              Retour à l&apos;accueil
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-base font-medium text-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez que le backend est lancé sur le port 3001.
            </p>
          </div>
        )}

        {/* Restaurant detail */}
        {restaurant && (
          <div className="space-y-6">
            {/* Hero gradient */}
            <div
              className="h-48 w-full rounded-2xl md:h-64"
              style={{
                background: `linear-gradient(135deg, hsl(${hashHue(restaurant.id)} 60% 45%) 0%, hsl(${hashHue(restaurant.id) + 30} 50% 35%) 100%)`,
              }}
            />

            {/* Info */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {restaurant.name}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {restaurant.isOpen !== null && restaurant.isOpen !== undefined && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      restaurant.isOpen
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                  </span>
                )}
                {restaurant.city && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {restaurant.city}
                  </span>
                )}
                {restaurant.openingTime && restaurant.closingTime && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {restaurant.openingTime} – {restaurant.closingTime}
                  </span>
                )}
                {restaurant.phone && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {restaurant.phone}
                  </span>
                )}
              </div>

              {/* Address */}
              {restaurant.address && (
                <p className="text-sm text-muted-foreground">{restaurant.address}</p>
              )}

              {/* Description */}
              {restaurant.description && (
                <p className="text-sm leading-relaxed text-foreground">{restaurant.description}</p>
              )}

              {/* Menu section placeholder */}
              <section className="mt-8">
                <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">Menu</h2>
                {restaurant.menuItems && restaurant.menuItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {restaurant.menuItems.map((item: Record<string, unknown>) => {
                      const name = String(item.name ?? 'Sans nom');
                      const desc = item.description ? String(item.description) : null;
                      const price = item.price !== undefined ? Number(item.price) : null;
                      const available = item.isAvailable !== false;
                      return (
                        <div
                          key={String(item.id ?? name)}
                          className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                        >
                          <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                          {desc && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {desc}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            {price !== null && (
                              <span className="text-sm font-bold text-primary">
                                {price.toLocaleString('fr-FR')} F
                              </span>
                            )}
                            {!available && (
                              <span className="text-[10px] font-medium text-destructive">
                                Indisponible
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Le menu de ce restaurant sera bientôt disponible.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/** Deterministic hue from id string */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 360;
}

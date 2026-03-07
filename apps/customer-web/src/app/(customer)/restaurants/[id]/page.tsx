import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Phone, Star, Bike, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { getRestaurantById, NotFoundError } from '@/lib/api/restaurants';
import type { ApiRestaurantDetail } from '@/lib/api/schemas';
import { getRestaurantAvailability, AVAILABILITY_BADGE_STYLES } from '@/lib/availability';
import { RestaurantMenuSection } from '@/components/menu/restaurant-menu-section';

interface Props {
  params: { id: string };
}

export default async function RestaurantDetailPage({ params }: Props) {
  let restaurant: ApiRestaurantDetail | null = null;
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

  if (notFound) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 px-4 text-center">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30" />
          <p className="text-lg font-semibold text-foreground">Restaurant introuvable</p>
          <p className="text-sm text-muted-foreground">Ce restaurant n&apos;existe pas ou a été supprimé.</p>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">Retour à l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader />
        <div className="mx-auto mt-20 flex max-w-md flex-col items-center gap-4 px-4 text-center">
          <p className="text-base font-medium text-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Vérifiez que le backend est lancé sur le port 3001.</p>
        </div>
      </div>
    );
  }

  const hue = hashHue(restaurant.id);
  const rating = mockRating(restaurant.id);
  const ratingCount = mockRatingCount(restaurant.id);
  const deliveryFee = mockDeliveryFee(restaurant.id);
  const eta = mockEta(restaurant.id);
  const cuisineType = inferCuisineType(restaurant);
  const availability = getRestaurantAvailability({ isOpen: restaurant.isOpen });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      {/* Hero Banner */}
      <div className="relative">
        <div
          className="h-56 w-full sm:h-64 md:h-72 lg:h-80"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 65% 48%) 0%, hsl(${(hue + 40) % 360} 55% 35%) 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back button */}
        <div className="absolute left-0 top-0 z-10 p-4">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 md:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Availability badge */}
            <span
              className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${AVAILABILITY_BADGE_STYLES[availability.status]}`}
            >
              {availability.label}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl md:text-4xl">
              {restaurant.name}
            </h1>
            {cuisineType && (
              <p className="mt-1 text-sm font-medium text-white/80">{cuisineType}</p>
            )}
          </div>
        </div>
      </div>

      {/* Closed / Out-of-zone banner */}
      {!availability.canOrder && (
        <div
          className={`border-b ${
            availability.status === 'CLOSED'
              ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/30'
              : 'border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/30'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
            <AlertTriangle
              className={`h-5 w-5 shrink-0 ${
                availability.status === 'CLOSED'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                availability.status === 'CLOSED'
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-orange-800 dark:text-orange-300'
              }`}
            >
              {availability.reason}
            </p>
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">({ratingCount} avis)</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{eta}–{eta + 10} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Bike className="h-3.5 w-3.5" />
            <span>{deliveryFee === 0 ? 'Livraison gratuite' : `${deliveryFee} F`}</span>
          </div>
          {restaurant.city && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{restaurant.city}</span>
            </div>
          )}
          {restaurant.openingTime && restaurant.closingTime && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{restaurant.openingTime} – {restaurant.closingTime}</span>
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{restaurant.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {restaurant.description && (
        <div className="mx-auto max-w-7xl px-4 pt-5 md:px-8">
          <p className="text-sm leading-relaxed text-muted-foreground">{restaurant.description}</p>
        </div>
      )}

      {/* Menu */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <RestaurantMenuSection
          menuItems={restaurant.menuItems}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          disabled={!availability.canOrder}
          disabledReason={availability.reason}
        />
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────── */

function NavHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>
    </header>
  );
}

/* ── Helpers ──────────────────────────────────────── */

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mockRating(id: string): string {
  return (4 + (hashCode(id) % 10) / 10).toFixed(1);
}

function mockRatingCount(id: string): number {
  return 50 + (hashCode(id) % 450);
}

function mockDeliveryFee(id: string): number {
  return [0, 500, 500, 600, 750, 800][hashCode(id) % 6];
}

function mockEta(id: string): number {
  return 15 + (hashCode(id) % 20);
}

function inferCuisineType(r: ApiRestaurantDetail): string | null {
  const text = [r.name, r.description ?? ''].join(' ').toLowerCase();
  if (text.includes('pizza') || text.includes('napoli')) return 'Pizzas italiennes';
  if (text.includes('burger')) return 'Burgers & Fast Food';
  if (text.includes('africa') || text.includes('maquis') || text.includes('attiéké') || text.includes('braisé'))
    return 'Cuisine africaine';
  if (text.includes('sushi') || text.includes('japonais')) return 'Cuisine japonaise';

  const categories = r.menuItems.map((m) => m.category).filter(Boolean);
  if (categories.length > 0) return categories[0] as string;

  return null;
}

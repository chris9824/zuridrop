import {
  RestaurantListResponseSchema,
  RestaurantSchema,
  type RestaurantListResponse,
  type ApiRestaurant,
} from './schemas';

export interface GetRestaurantsParams {
  page?: number;
  limit?: number;
  sort?: 'asc' | 'desc';
  q?: string;
  city?: string;
  isOpenNow?: boolean;
}

const DEFAULTS: GetRestaurantsParams = {
  page: 1,
  limit: 20,
  sort: 'desc',
  city: 'Abidjan',
};

/**
 * Fetch restaurants from the BFF route.
 * Works both server-side and client-side.
 */
export async function getRestaurants(
  params: GetRestaurantsParams = {},
): Promise<RestaurantListResponse> {
  const merged = { ...DEFAULTS, ...params };
  const qs = new URLSearchParams();

  if (merged.page) qs.set('page', String(merged.page));
  if (merged.limit) qs.set('limit', String(merged.limit));
  if (merged.sort) qs.set('sort', merged.sort);
  if (merged.q) qs.set('q', merged.q);
  if (merged.city) qs.set('city', merged.city);
  if (merged.isOpenNow !== undefined) qs.set('isOpenNow', String(merged.isOpenNow));

  // In server components, use absolute URL; in client, relative works
  const base = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001') + '/api/v1/restaurants'
    : '/api/restaurants';

  const res = await fetch(`${base}?${qs.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de charger les restaurants.`);
  }

  const json = await res.json();

  // Tolerant parsing — if backend returns an array directly, wrap it
  if (Array.isArray(json)) {
    return { items: json };
  }

  // Try standard shape { items, meta } or { data, meta }
  const normalized = {
    items: json.items ?? json.data ?? [],
    meta: json.meta ?? json.pagination ?? undefined,
  };

  // Validate with zod (safe parse to never crash)
  const parsed = RestaurantListResponseSchema.safeParse(normalized);
  if (parsed.success) {
    return parsed.data;
  }

  console.warn('[getRestaurants] Zod parse warning:', parsed.error.message);
  // Fallback: return whatever we got
  return normalized as RestaurantListResponse;
}

/* ── Single restaurant ────────────────────────────── */

/**
 * Fetch a single restaurant by ID.
 * Works both server-side and client-side.
 */
export async function getRestaurantById(id: string): Promise<ApiRestaurant> {
  const base = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001') + `/api/v1/restaurants/${id}`
    : `/api/restaurants/${id}`;

  const res = await fetch(base, { cache: 'no-store' });

  if (res.status === 404) {
    throw new NotFoundError('Restaurant introuvable.');
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de charger ce restaurant.`);
  }

  const json = await res.json();

  const parsed = RestaurantSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data;
  }

  console.warn('[getRestaurantById] Zod parse warning:', parsed.error.message);
  return json as ApiRestaurant;
}

/* ── Custom error for 404 ─────────────────────────── */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

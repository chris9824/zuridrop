import { authFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export type ReviewType = 'RESTAURANT' | 'DRIVER';

export interface ApiReview {
  id: string;
  orderId: string;
  type: ReviewType;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function getOrderReviews(orderId: string): Promise<ApiReview[]> {
  const res = await authFetch(`${API_BASE}/api/v1/reviews/order/${orderId}`);

  if (res.status === 401) {
    throw new AuthRequiredError();
  }

  if (!res.ok) {
    throw new Error('Impossible de charger les avis');
  }

  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

export async function createReview(payload: {
  orderId: string;
  type: ReviewType;
  rating: number;
  comment?: string;
}): Promise<ApiReview> {
  const res = await authFetch(`${API_BASE}/api/v1/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new AuthRequiredError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? 'Erreur lors de l\'envoi de l\'avis');
  }

  return res.json();
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Authentification requise');
    this.name = 'AuthRequiredError';
  }
}

/* ── Restaurant summary (public, no auth) ───────────── */
export interface RestaurantReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export async function getRestaurantReviewSummary(
  restaurantId: string,
): Promise<RestaurantReviewSummary> {
  const base =
    typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001')
      : API_BASE;
  const res = await fetch(
    `${base}/api/v1/reviews/restaurants/${restaurantId}/summary`,
    { cache: 'no-store' },
  );

  if (!res.ok) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const json = await res.json();
  return {
    averageRating: typeof json.averageRating === 'number' ? json.averageRating : 0,
    reviewCount: typeof json.reviewCount === 'number' ? json.reviewCount : 0,
  };
}

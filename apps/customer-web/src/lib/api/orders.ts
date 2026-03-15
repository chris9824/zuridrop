import {
  OrderResponseSchema,
  OrderDetailSchema,
  OrdersListResponseSchema,
  type ApiOrderResponse,
  type ApiOrderDetail,
  type ApiOrdersListResponse,
} from './schemas';
import { authFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/* ── Create order ─────────────────────────────────── */
export interface CreateOrderPayload {
  restaurantId: string;
  deliveryAddressId?: string;
  items: { menuItemId: string; quantity: number }[];
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY';
  notes?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<ApiOrderResponse> {
  const res = await authFetch(`${API_BASE}/api/v1/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status === 401) {
    throw new Error('Vous devez être connecté pour passer une commande.');
  }

  if (res.status === 400) {
    const body = await res.json().catch(() => null);
    const msg = body?.message || 'Erreur lors de la création de la commande.';
    if (typeof msg === 'string' && msg.toLowerCase().includes('fermé')) {
      throw new RestaurantClosedError();
    }
    throw new Error(msg);
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de créer la commande.`);
  }

  const json = await res.json();
  const parsed = OrderResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : (json as ApiOrderResponse);
}

/* ── Get my orders (customer) ─────────────────────── */
export async function getMyOrders(page = 1, limit = 20): Promise<ApiOrdersListResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit), sort: 'desc' });
  const res = await authFetch(`${API_BASE}/api/v1/orders/mine?${qs.toString()}`);

  if (res.status === 401) {
    throw new AuthRequiredError();
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de charger vos commandes.`);
  }

  const json = await res.json();
  const parsed = OrdersListResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : (json as ApiOrdersListResponse);
}

/* ── Get single order by ID ──────────────────────── */
export async function getOrderById(id: string): Promise<ApiOrderDetail> {
  const res = await authFetch(`${API_BASE}/api/v1/orders/${id}`);

  if (res.status === 401) {
    throw new AuthRequiredError();
  }

  if (res.status === 404) {
    throw new OrderNotFoundError();
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de charger cette commande.`);
  }

  const json = await res.json();
  const parsed = OrderDetailSchema.safeParse(json);
  return parsed.success ? parsed.data : (json as ApiOrderDetail);
}

/* ── Live tracking ──────────────────────────────── */
export interface TrackingData {
  orderId: string;
  status: 'WAITING' | 'EN_ROUTE' | 'APPROACHING' | 'ARRIVED';
  restaurant: { lat: number; lng: number } | null;
  customer: { lat: number; lng: number } | null;
  driver: { lat: number; lng: number } | null;
  distanceRemainingKm: number | null;
  percentProgress: number;
  updatedAt: string;
}

export async function getOrderTracking(orderId: string): Promise<TrackingData | null> {
  try {
    const res = await authFetch(`${API_BASE}/api/v1/orders/${orderId}/tracking`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ── Custom errors ───────────────────────────────── */
export class RestaurantClosedError extends Error {
  constructor() {
    super('Le restaurant est fermé pour le moment. Réessayez plus tard.');
    this.name = 'RestaurantClosedError';
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Vous devez être connecté.');
    this.name = 'AuthRequiredError';
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('Commande introuvable.');
    this.name = 'OrderNotFoundError';
  }
}

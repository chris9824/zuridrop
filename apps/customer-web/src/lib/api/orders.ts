import { OrderResponseSchema, type ApiOrderResponse } from './schemas';
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
    // Handle "restaurant is closed" from backend
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

export class RestaurantClosedError extends Error {
  constructor() {
    super('Le restaurant est fermé pour le moment. Réessayez plus tard.');
    this.name = 'RestaurantClosedError';
  }
}

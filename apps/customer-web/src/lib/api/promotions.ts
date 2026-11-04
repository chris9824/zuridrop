import { authFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface ValidatePromoPayload {
  code: string;
  subtotal: number;
  deliveryFee: number;
  restaurantId?: string;
}

export interface ValidatePromoResult {
  valid: boolean;
  message?: string;
  promotionId?: string;
  promoCode?: string;
  type?: string;
  discountAmount: number;
  freeDelivery: boolean;
  finalTotal: number;
}

/** Valide un code promo. Utilise l'endpoint auth si connecté (limite par user). */
export async function validatePromo(payload: ValidatePromoPayload): Promise<ValidatePromoResult> {
  const res = await authFetch(`${API_BASE}/api/v1/promotions/validate/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: payload.code.trim().toUpperCase(),
      subtotal: payload.subtotal,
      deliveryFee: payload.deliveryFee,
      restaurantId: payload.restaurantId,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      res.status === 401
        ? 'Connectez-vous pour appliquer un code promo'
        : data?.message ?? 'Erreur lors de la validation';
    return {
      valid: false,
      message: msg,
      discountAmount: 0,
      freeDelivery: false,
      finalTotal: payload.subtotal + payload.deliveryFee,
    };
  }

  return data as ValidatePromoResult;
}

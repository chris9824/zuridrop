import { z } from 'zod';
import { AddressSchema, type ApiAddress } from './schemas';
import { authFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface AddressesResponse {
  data: ApiAddress[];
  defaultAddressId: string | null;
}

/**
 * Get current user's addresses and default address id (requires auth).
 */
export async function getMyAddresses(): Promise<AddressesResponse> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me/addresses`);

  if (res.status === 401) {
    throw new AuthRequiredError();
  }

  if (!res.ok) {
    throw new Error(`Erreur ${res.status}: impossible de charger les adresses.`);
  }

  const json = await res.json();
  const arr = Array.isArray(json) ? json : json.items ?? json.data ?? [];
  const defaultAddressId = json.defaultAddressId ?? null;

  const parsed = z.array(AddressSchema).safeParse(arr);
  const data = parsed.success ? parsed.data : (arr as ApiAddress[]);
  return { data, defaultAddressId };
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Authentification requise.');
    this.name = 'AuthRequiredError';
  }
}

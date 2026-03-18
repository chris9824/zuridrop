import { authFetch } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  zipCode?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CreateAddressPayload {
  label?: string;
  street: string;
  city: string;
  zipCode?: string;
  country?: string;
}

export interface UpdateAddressPayload {
  label?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

export async function getMe(): Promise<UserProfile> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me`);
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function getMyAddresses(): Promise<Address[]> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me/addresses`);
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createAddress(payload: CreateAddressPayload): Promise<Address> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me/addresses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await authFetch(`${API_BASE}/api/v1/users/me/addresses/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

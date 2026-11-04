import { authFetch } from './auth';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export type DeliveryStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type DriverAvailability = 'OFFLINE' | 'AVAILABLE' | 'BUSY';

export interface DeliveryDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface DeliveryOrder {
  id: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  createdAt: string;
  items: { id: string; quantity: number; unitPrice: number; total: number; menuItem: { id: string; name: string; price: number } }[];
  customer: { id: string; firstName: string; lastName: string; phone?: string };
  restaurant: { id: string; name: string; street?: string; city?: string; latitude?: number; longitude?: number };
  deliveryAddress?: { id: string; street: string; city: string; label?: string; latitude?: number; longitude?: number } | null;
}

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryStatus;
  deliveryFee: number;
  assignedAt: string;
  assignmentExpiresAt?: string | null;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  startedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  order: DeliveryOrder;
  driver: DeliveryDriver;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API}${path}`, init);
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export const setAvailability = (availability: 'AVAILABLE' | 'OFFLINE') =>
  api<{ availability: DriverAvailability; isOnline: boolean }>('/api/v1/driver/availability', {
    method: 'PATCH',
    body: JSON.stringify({ availability }),
  });

export const getMyDeliveries = () =>
  api<Delivery[]>('/api/v1/driver/deliveries/mine');

export const getDeliveryById = (id: string) =>
  api<Delivery>(`/api/v1/driver/deliveries/${id}`);

export const getHistory = () =>
  api<Delivery[]>('/api/v1/driver/deliveries/history');

export const acceptDelivery = (id: string) =>
  api<Delivery>(`/api/v1/driver/deliveries/${id}/accept`, { method: 'PATCH' });

export const rejectDelivery = (id: string, reason?: string) =>
  api<{ message: string }>(`/api/v1/driver/deliveries/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const pickupDelivery = (id: string) =>
  api<Delivery>(`/api/v1/driver/deliveries/${id}/pickup`, { method: 'PATCH' });

export const startDelivery = (id: string) =>
  api<Delivery>(`/api/v1/driver/deliveries/${id}/start`, { method: 'PATCH' });

export const completeDelivery = (id: string) =>
  api<Delivery>(`/api/v1/driver/deliveries/${id}/complete`, { method: 'PATCH' });

export type MeResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  availability: DriverAvailability;
  isOnline: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
};

export const getMe = () =>
  api<MeResponse>('/api/v1/users/me');

export interface DriverProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
  isOnline: boolean;
  availability: DriverAvailability;
}

export const getDriverProfile = () =>
  api<DriverProfile>('/api/v1/driver/profile');

export const updateDriverProfile = (data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  vehicleType?: string;
  plateNumber?: string;
  isOnline?: boolean;
}) =>
  api<DriverProfile>('/api/v1/driver/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/* ── Reviews (driver reputation) ─────────────────── */

export interface DriverReviewSummary {
  averageRating: number;
  reviewCount: number;
}

export interface DriverReview {
  id: string;
  orderId: string;
  type: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer?: { firstName?: string; lastName?: string };
}

export interface DriverReviewsResponse {
  data: DriverReview[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
  reviewCount: number;
}

export const getMyDriverSummary = () =>
  api<DriverReviewSummary>('/api/v1/reviews/drivers/me/summary');

export const getMyDriverReviews = (page = 1, limit = 10) =>
  api<DriverReviewsResponse>(`/api/v1/reviews/drivers/me?page=${page}&limit=${limit}`);

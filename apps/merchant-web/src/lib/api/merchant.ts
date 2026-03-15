import { authFetch } from './auth';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API}${path}`, init);
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

/* ── Types ────────────────────────────────────── */

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  menuItem: { id: string; name: string; price: number; description?: string | null };
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string | null;
  paymentMethod?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  customer: { id: string; firstName: string; lastName: string; email?: string; phone?: string | null };
  restaurant: { id: string; name: string };
  deliveryAddress?: { street: string; city: string } | null;
  delivery?: { id: string; status: string; driverId?: string } | null;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string | null;
  isAvailable: boolean;
  restaurantId: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  imageUrl?: string | null;
  isOpen: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  menuItems: MenuItem[];
  createdAt: string;
}

/* ── Orders ───────────────────────────────────── */

export const getIncomingOrders = () =>
  api<OrdersResponse>('/api/v1/merchant/orders/incoming');

export const getActiveOrders = () =>
  api<OrdersResponse>('/api/v1/merchant/orders/active');

export const getOrderHistory = (page = 1, limit = 30) =>
  api<OrdersResponse>(`/api/v1/orders/restaurant?page=${page}&limit=${limit}&sort=desc`);

export const acceptOrder = (orderId: string) =>
  api<Order>(`/api/v1/merchant/orders/${orderId}/accept`, { method: 'PATCH' });

export const startPreparing = (orderId: string) =>
  api<Order>(`/api/v1/merchant/orders/${orderId}/start-preparing`, { method: 'PATCH' });

export const readyForPickup = (orderId: string) =>
  api<Order>(`/api/v1/merchant/orders/${orderId}/ready-for-pickup`, { method: 'PATCH' });

export const cancelOrder = (orderId: string, reason?: string) =>
  api<Order>(`/api/v1/merchant/orders/${orderId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

/* ── Restaurants ──────────────────────────────── */

export const getMyRestaurants = () =>
  api<Restaurant[]>('/api/v1/restaurants/merchant/mine');

export const toggleRestaurantOpen = (id: string) =>
  api<Restaurant>(`/api/v1/restaurants/${id}/toggle-open`, { method: 'PUT' });

export const updateRestaurant = (id: string, data: Partial<Restaurant>) =>
  api<Restaurant>(`/api/v1/restaurants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

/* ── Menu Items ───────────────────────────────── */

export const toggleMenuItemAvailability = (id: string) =>
  api<MenuItem>(`/api/v1/restaurants/menu-items/${id}/toggle-availability`, { method: 'PUT' });

export const updateMenuItem = (id: string, data: Partial<MenuItem>) =>
  api<MenuItem>(`/api/v1/restaurants/menu-items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const createMenuItem = (data: { restaurantId: string; name: string; price: number; description?: string; category?: string; imageUrl?: string }) =>
  api<MenuItem>('/api/v1/restaurants/menu-items', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/* ── User ─────────────────────────────────────── */

export const getMe = () =>
  api<{ id: string; email: string; firstName: string; lastName: string; role: string }>('/api/v1/users/me');

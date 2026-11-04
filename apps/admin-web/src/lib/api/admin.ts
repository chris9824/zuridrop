import { authFetch } from './auth';

// En dev sans .env : URL relative → proxy Next.js vers l'API. Sinon : URL complète.
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await authFetch(`${API}${path}`, init);
  if (res.status === 401) throw new Error('AUTH_REQUIRED');
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export interface DashboardData {
  kpis: {
    totalOrders: number;
    ordersToday: number;
    totalRevenue: number;
    revenueToday: number;
    totalRestaurants: number;
    totalDrivers: number;
    totalCustomers: number;
    activeOrdersCount: number;
  };
  ordersLast7Days: { date: string; count: number; revenue: number }[];
  recentOrders: AdminOrder[];
  recentRestaurants: {
    id: string;
    name: string;
    city: string | null;
    isOpen: boolean;
    createdAt: string;
  }[];
  recentDrivers: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isOnline: boolean;
    createdAt: string;
  }[];
}

export interface AdminOrder {
  id: string;
  status: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer: { id: string; firstName: string; lastName: string; email: string };
  restaurant: { id: string; name: string };
  delivery?: {
    driver: { id: string; firstName: string; lastName: string };
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getDashboard = () => api<DashboardData>('/api/v1/admin/dashboard');

export const getAdminOrders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  return api<PaginatedResponse<AdminOrder>>(`/api/v1/admin/orders?${qs.toString()}`);
};

export const getAdminRestaurants = (params?: { page?: number; limit?: number; q?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.q) qs.set('q', params.q);
  return api<PaginatedResponse<AdminRestaurant>>(`/api/v1/admin/restaurants?${qs.toString()}`);
};

export const getAdminDrivers = (params?: { page?: number; limit?: number; q?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.q) qs.set('q', params.q);
  return api<PaginatedResponse<AdminDriver>>(`/api/v1/admin/drivers?${qs.toString()}`);
};

export const getAdminCustomers = (params?: { page?: number; limit?: number; q?: string }) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.q) qs.set('q', params.q);
  return api<PaginatedResponse<AdminCustomer>>(`/api/v1/admin/customers?${qs.toString()}`);
};

export interface AdminRestaurant {
  id: string;
  name: string;
  cuisineType: string | null;
  phone: string | null;
  city: string | null;
  isOpen: boolean;
  ordersCount: number;
  revenue: number;
}

export interface AdminDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isOnline: boolean;
  availability: string;
  isActive: boolean;
  deliveriesCount: number;
  createdAt: string;
}

export interface AdminCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  ordersCount: number;
  createdAt: string;
}

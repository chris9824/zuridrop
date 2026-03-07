import { z } from 'zod';

/* ── Menu Item ────────────────────────────────────── */
export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  price: z.number(),
  isAvailable: z.boolean(),
  category: z.string().optional().nullable(),
  restaurantId: z.string(),
});

export type ApiMenuItem = z.infer<typeof MenuItemSchema>;

/* ── Merchant (partial) ───────────────────────────── */
const MerchantSchema = z.object({
  id: z.string(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
}).optional().nullable();

/* ── Restaurant (list — menuItems optional) ───────── */
export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().optional().nullable(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  menuItems: z.array(z.any()).optional().nullable(),
  owner: z.any().optional().nullable(),
});

export type ApiRestaurant = z.infer<typeof RestaurantSchema>;

/* ── Restaurant detail (typed menuItems) ──────────── */
export const RestaurantDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isOpen: z.boolean().optional().nullable(),
  openingTime: z.string().optional().nullable(),
  closingTime: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  menuItems: z.array(MenuItemSchema).default([]),
  merchant: MerchantSchema,
});

export type ApiRestaurantDetail = z.infer<typeof RestaurantDetailSchema>;

/* ── Paginated list response ──────────────────────── */
export const RestaurantListResponseSchema = z.object({
  items: z.array(RestaurantSchema),
  meta: z.any().optional(),
});

export type RestaurantListResponse = z.infer<typeof RestaurantListResponseSchema>;

/* ── Address ──────────────────────────────────────── */
export const AddressSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  label: z.string().optional().nullable(),
  street: z.string(),
  city: z.string(),
  zipCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

export type ApiAddress = z.infer<typeof AddressSchema>;

/* ── Order Item ───────────────────────────────────── */
export const OrderItemSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  quantity: z.number(),
  priceAtOrder: z.number().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  menuItem: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    price: z.number(),
  }).optional().nullable(),
});

export type ApiOrderItem = z.infer<typeof OrderItemSchema>;

/* ── Order (create response — simple) ────────────── */
export const OrderResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  totalAmount: z.number().optional().nullable(),
  deliveryFee: z.number().optional().nullable(),
  restaurantId: z.string().optional(),
  customerId: z.string().optional(),
  createdAt: z.string().optional().nullable(),
}).passthrough();

export type ApiOrderResponse = z.infer<typeof OrderResponseSchema>;

/* ── Order (full detail) ─────────────────────────── */
export const OrderDetailSchema = z.object({
  id: z.string(),
  status: z.string(),
  totalAmount: z.number().optional().nullable(),
  deliveryFee: z.number().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  restaurantId: z.string().optional(),
  customerId: z.string().optional(),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  items: z.array(OrderItemSchema).default([]),
  restaurant: z.object({
    id: z.string(),
    name: z.string(),
  }).optional().nullable(),
  customer: z.object({
    id: z.string(),
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
  }).optional().nullable(),
  deliveryAddress: AddressSchema.optional().nullable(),
  delivery: z.object({
    id: z.string(),
    status: z.string(),
    driverId: z.string().optional().nullable(),
  }).optional().nullable(),
}).passthrough();

export type ApiOrderDetail = z.infer<typeof OrderDetailSchema>;

/* ── Orders list response ────────────────────────── */
export const OrdersListResponseSchema = z.object({
  data: z.array(OrderDetailSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),
});

export type ApiOrdersListResponse = z.infer<typeof OrdersListResponseSchema>;

/* ── Auth login response ──────────────────────────── */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAt: z.string().optional(),
  refreshToken: z.string().optional(),
  refreshTokenExpiresAt: z.string().optional(),
}).passthrough();

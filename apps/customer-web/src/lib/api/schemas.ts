import { z } from 'zod';

/* ── Restaurant schema ────────────────────────────── */
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
  // Menu items may or may not be included
  menuItems: z.array(z.any()).optional().nullable(),
  // Owner info may or may not be included
  owner: z.any().optional().nullable(),
});

export type ApiRestaurant = z.infer<typeof RestaurantSchema>;

/* ── Paginated list response ──────────────────────── */
export const RestaurantListResponseSchema = z.object({
  items: z.array(RestaurantSchema),
  meta: z.any().optional(),
});

export type RestaurantListResponse = z.infer<typeof RestaurantListResponseSchema>;

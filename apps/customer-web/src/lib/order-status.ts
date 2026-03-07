/**
 * Order status mapping — single source of truth for customer UI.
 * Aligned with backend OrderStatus enum from @zuridrop/shared.
 */

export type OrderStatusKey =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface StatusConfig {
  label: string;
  message: string;
  color: string;
  bgClass: string;
  textClass: string;
  step: number;
}

const STATUS_MAP: Record<OrderStatusKey, StatusConfig> = {
  PENDING: {
    label: 'Commande reçue',
    message: 'Le restaurant a bien reçu votre commande.',
    color: 'amber',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-400',
    step: 0,
  },
  ACCEPTED: {
    label: 'Commande confirmée',
    message: 'Le restaurant a accepté votre commande.',
    color: 'blue',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    step: 1,
  },
  PREPARING: {
    label: 'En préparation',
    message: 'Le restaurant prépare votre commande.',
    color: 'blue',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    step: 2,
  },
  READY_FOR_PICKUP: {
    label: 'Prête',
    message: 'Votre commande est prête et attend le livreur.',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 3,
  },
  PICKED_UP: {
    label: 'Récupérée',
    message: 'Le livreur a récupéré votre commande.',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 4,
  },
  IN_TRANSIT: {
    label: 'En route',
    message: 'Votre commande est en route. Elle arrive bientôt !',
    color: 'indigo',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    step: 5,
  },
  DELIVERED: {
    label: 'Livrée',
    message: 'Votre commande a été livrée. Bon appétit !',
    color: 'green',
    bgClass: 'bg-green-500/10 dark:bg-green-500/20',
    textClass: 'text-green-700 dark:text-green-400',
    step: 6,
  },
  CANCELLED: {
    label: 'Annulée',
    message: 'Cette commande a été annulée.',
    color: 'red',
    bgClass: 'bg-red-500/10 dark:bg-red-500/20',
    textClass: 'text-red-700 dark:text-red-400',
    step: -1,
  },
};

/** Timeline steps in display order (excludes CANCELLED) */
export const TIMELINE_STEPS: OrderStatusKey[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
];

export function getStatusConfig(status: string): StatusConfig {
  const key = status as OrderStatusKey;
  return STATUS_MAP[key] ?? STATUS_MAP.PENDING;
}

export function isFinalStatus(status: string): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}

export function getProgressPercent(status: string): number {
  if (status === 'CANCELLED') return 0;
  const config = getStatusConfig(status);
  return Math.round((config.step / 6) * 100);
}

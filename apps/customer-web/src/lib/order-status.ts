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
  heroTitle: string;
  heroSubtitle: string;
  etaLabel: string;
  icon: 'clock' | 'check-circle' | 'chef-hat' | 'package' | 'bike' | 'truck' | 'party' | 'x-circle';
  color: string;
  bgClass: string;
  textClass: string;
  step: number;
}

const STATUS_MAP: Record<OrderStatusKey, StatusConfig> = {
  PENDING: {
    label: 'Commande reçue',
    message: 'Le restaurant a bien reçu votre commande.',
    heroTitle: 'Commande reçue',
    heroSubtitle: 'Le restaurant examine votre commande. Vous serez notifié dès qu\'elle sera acceptée.',
    etaLabel: 'En attente de confirmation',
    icon: 'clock',
    color: 'amber',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
    textClass: 'text-amber-700 dark:text-amber-400',
    step: 0,
  },
  ACCEPTED: {
    label: 'Commande confirmée',
    message: 'Le restaurant a accepté votre commande.',
    heroTitle: 'Commande confirmée !',
    heroSubtitle: 'Le restaurant a accepté votre commande et va commencer la préparation.',
    etaLabel: 'Préparation imminente',
    icon: 'check-circle',
    color: 'blue',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    step: 1,
  },
  PREPARING: {
    label: 'En préparation',
    message: 'Le restaurant prépare votre commande.',
    heroTitle: 'Le restaurant prépare votre commande',
    heroSubtitle: 'Vos plats sont en cours de préparation. Encore un peu de patience !',
    etaLabel: 'Préparation en cours',
    icon: 'chef-hat',
    color: 'blue',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    step: 2,
  },
  READY_FOR_PICKUP: {
    label: 'Prête',
    message: 'Votre commande est prête et attend le livreur.',
    heroTitle: 'Commande prête !',
    heroSubtitle: 'Votre commande attend qu\'un livreur vienne la récupérer.',
    etaLabel: 'En attente du livreur',
    icon: 'package',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 3,
  },
  PICKED_UP: {
    label: 'Récupérée',
    message: 'Le livreur a récupéré votre commande.',
    heroTitle: 'Le livreur a votre commande',
    heroSubtitle: 'Le livreur a récupéré votre commande et se dirige vers vous.',
    etaLabel: 'Le livreur arrive bientôt',
    icon: 'bike',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 4,
  },
  IN_TRANSIT: {
    label: 'En route',
    message: 'Votre commande est en route. Elle arrive bientôt !',
    heroTitle: 'Votre commande est en route !',
    heroSubtitle: 'Le livreur est en chemin. Préparez-vous à réceptionner votre commande.',
    etaLabel: 'Livraison en cours',
    icon: 'truck',
    color: 'indigo',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textClass: 'text-indigo-700 dark:text-indigo-400',
    step: 5,
  },
  DELIVERED: {
    label: 'Livrée',
    message: 'Votre commande a été livrée. Bon appétit !',
    heroTitle: 'Commande livrée !',
    heroSubtitle: 'Votre commande a bien été livrée. Nous vous souhaitons un excellent repas !',
    etaLabel: 'Livrée',
    icon: 'party',
    color: 'green',
    bgClass: 'bg-green-500/10 dark:bg-green-500/20',
    textClass: 'text-green-700 dark:text-green-400',
    step: 6,
  },
  CANCELLED: {
    label: 'Annulée',
    message: 'Cette commande a été annulée.',
    heroTitle: 'Commande annulée',
    heroSubtitle: 'Cette commande a été annulée. Vous pouvez en passer une nouvelle.',
    etaLabel: 'Annulée',
    icon: 'x-circle',
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

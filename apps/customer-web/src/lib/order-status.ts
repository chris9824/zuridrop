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
    label: 'Prête — en attente d\'un livreur',
    message: 'Le restaurant a terminé la préparation. Nous cherchons un livreur pour votre commande.',
    heroTitle: 'Commande prête, en attente d\'un livreur',
    heroSubtitle: 'Votre commande est prête. Nous recherchons un livreur disponible à proximité.',
    etaLabel: 'Recherche d\'un livreur',
    icon: 'package',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 3,
  },
  PICKED_UP: {
    label: 'Récupérée par le livreur',
    message: 'Le livreur a récupéré votre commande et se dirige vers vous.',
    heroTitle: 'Commande récupérée par le livreur',
    heroSubtitle: 'Le livreur a récupéré votre commande au restaurant et se dirige vers vous.',
    etaLabel: 'Le livreur arrive bientôt',
    icon: 'bike',
    color: 'purple',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-400',
    step: 4,
  },
  IN_TRANSIT: {
    label: 'Votre commande est en route vers votre adresse',
    message: 'Votre commande est en route vers votre adresse. Elle arrive bientôt !',
    heroTitle: 'Votre commande est en route vers votre adresse',
    heroSubtitle: 'Votre commande est en route vers votre adresse. Elle arrive bientôt !',
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

/* ── Derived UI state (combines status + driver presence) ─── */

export interface AssignedDriver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface DerivedStatusInfo {
  label: string;
  subtitle: string;
  driverAssigned: boolean;
  driverName?: string;
}

export function getDerivedStatus(
  status: string,
  assignedDriver?: AssignedDriver | null,
): DerivedStatusInfo {
  if (status === 'READY_FOR_PICKUP' && assignedDriver) {
    return {
      label: 'Livreur assigné',
      subtitle: `${assignedDriver.firstName} ${assignedDriver.lastName} va récupérer votre commande.`,
      driverAssigned: true,
      driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
    };
  }

  if (status === 'READY_FOR_PICKUP') {
    return {
      label: 'Commande prête — en attente d\'un livreur',
      subtitle: 'Le restaurant a terminé la préparation. Nous cherchons un livreur.',
      driverAssigned: false,
    };
  }

  if (status === 'PICKED_UP') {
    const driverName = assignedDriver
      ? `${assignedDriver.firstName} ${assignedDriver.lastName}`
      : 'Le livreur';
    return {
      label: 'Commande récupérée par le livreur',
      subtitle: `${driverName} a récupéré votre commande et se dirige vers vous.`,
      driverAssigned: !!assignedDriver,
      driverName: assignedDriver ? driverName : undefined,
    };
  }

  const config = getStatusConfig(status);
  return {
    label: config.label,
    subtitle: config.message,
    driverAssigned: !!assignedDriver,
    driverName: assignedDriver
      ? `${assignedDriver.firstName} ${assignedDriver.lastName}`
      : undefined,
  };
}

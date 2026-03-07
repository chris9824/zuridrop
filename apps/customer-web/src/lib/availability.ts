/**
 * Restaurant availability — single source of truth for the UI.
 *
 * Current logic (MVP):
 *   - `isOpen` field from the backend → OPEN / CLOSED
 *   - OUT_OF_ZONE is architecturally prepared but only triggered
 *     when the backend provides delivery-zone info per address.
 */

export type AvailabilityStatus = 'OPEN' | 'CLOSED' | 'OUT_OF_ZONE';

export interface Availability {
  status: AvailabilityStatus;
  label: string;
  reason?: string;
  canOrder: boolean;
}

interface RestaurantLike {
  isOpen?: boolean | null;
}

/**
 * Derives the availability for a restaurant.
 *
 * @param restaurant  Any object that has an `isOpen` field
 * @param _address    Reserved for future zone check (not used yet)
 */
export function getRestaurantAvailability(
  restaurant: RestaurantLike,
  _address?: { latitude?: number | null; longitude?: number | null } | null,
): Availability {
  if (restaurant.isOpen === false) {
    return {
      status: 'CLOSED',
      label: 'Fermé',
      reason: 'Ce restaurant est fermé pour le moment.',
      canOrder: false,
    };
  }

  // Future: check distance between restaurant and address
  // if (_address && restaurantCoords && distance > MAX_KM) {
  //   return {
  //     status: 'OUT_OF_ZONE',
  //     label: 'Hors zone',
  //     reason: "Ce restaurant n'est pas disponible pour votre zone de livraison.",
  //     canOrder: false,
  //   };
  // }

  return {
    status: 'OPEN',
    label: 'Ouvert',
    canOrder: true,
  };
}

export const AVAILABILITY_BADGE_STYLES: Record<AvailabilityStatus, string> = {
  OPEN: 'bg-green-500/90 text-white',
  CLOSED: 'bg-red-500/90 text-white',
  OUT_OF_ZONE: 'bg-orange-500/90 text-white',
};

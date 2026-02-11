/**
 * Restaurant opening hours utility.
 *
 * Uses the restaurant's isOpen flag + openingTime/closingTime fields.
 * Time format expected: "HH:mm" (24h), e.g. "08:00", "22:30".
 */

interface RestaurantHours {
  isOpen: boolean;
  openingTime?: string | null;
  closingTime?: string | null;
}

/**
 * Determines if a restaurant is currently open.
 *
 * Logic:
 * 1. If isOpen flag is false → closed (manual override by merchant)
 * 2. If openingTime and closingTime are both set → check current time is within range
 * 3. If hours are not set but isOpen is true → considered open (merchant controls manually)
 *
 * Supports overnight ranges (e.g. openingTime="20:00", closingTime="04:00").
 */
export function isRestaurantOpenNow(
  restaurant: RestaurantHours,
  now: Date = new Date(),
): boolean {
  // Manual toggle takes priority
  if (!restaurant.isOpen) {
    return false;
  }

  // If no hours configured, rely on isOpen flag alone
  if (!restaurant.openingTime || !restaurant.closingTime) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(restaurant.openingTime);
  const closeMinutes = parseTimeToMinutes(restaurant.closingTime);

  if (openMinutes === null || closeMinutes === null) {
    // Invalid time format — fall back to isOpen flag
    return true;
  }

  // Same-day range (e.g. 08:00 - 22:00)
  if (openMinutes <= closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  // Overnight range (e.g. 20:00 - 04:00)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

/**
 * Parses "HH:mm" to total minutes since midnight.
 * Returns null if format is invalid.
 */
function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

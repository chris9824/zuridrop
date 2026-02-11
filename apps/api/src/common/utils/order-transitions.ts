/**
 * Centralized order status transition rules.
 *
 * For each current status, defines which statuses it can transition to
 * and which roles are allowed to make that transition.
 *
 * Flow typique:
 *   PENDING ─(merchant)─► ACCEPTED ─(merchant)─► PREPARING
 *     ─(merchant)─► READY_FOR_PICKUP ─(driver)─► PICKED_UP
 *     ─(driver)─► IN_TRANSIT ─(driver)─► DELIVERED
 *
 * Cancel allowed from PENDING or ACCEPTED (merchant/admin/customer).
 */

import { OrderStatus, Role } from '@prisma/client';

interface TransitionRule {
  to: OrderStatus;
  allowedRoles: Role[];
}

/**
 * Map: current status → allowed transitions
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, TransitionRule[]> = {
  [OrderStatus.PENDING]: [
    { to: OrderStatus.ACCEPTED, allowedRoles: [Role.MERCHANT, Role.ADMIN] },
    { to: OrderStatus.CANCELLED, allowedRoles: [Role.MERCHANT, Role.ADMIN, Role.CUSTOMER] },
  ],
  [OrderStatus.ACCEPTED]: [
    { to: OrderStatus.PREPARING, allowedRoles: [Role.MERCHANT, Role.ADMIN] },
    { to: OrderStatus.CANCELLED, allowedRoles: [Role.MERCHANT, Role.ADMIN] },
  ],
  [OrderStatus.PREPARING]: [
    { to: OrderStatus.READY_FOR_PICKUP, allowedRoles: [Role.MERCHANT, Role.ADMIN] },
    { to: OrderStatus.CANCELLED, allowedRoles: [Role.ADMIN] },
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    { to: OrderStatus.PICKED_UP, allowedRoles: [Role.DRIVER, Role.ADMIN] },
    { to: OrderStatus.CANCELLED, allowedRoles: [Role.ADMIN] },
  ],
  [OrderStatus.PICKED_UP]: [
    { to: OrderStatus.IN_TRANSIT, allowedRoles: [Role.DRIVER, Role.ADMIN] },
  ],
  [OrderStatus.IN_TRANSIT]: [
    { to: OrderStatus.DELIVERED, allowedRoles: [Role.DRIVER, Role.ADMIN] },
  ],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Validates whether a transition is allowed.
 * Returns { valid: true } or { valid: false, reason: string }.
 */
export function validateTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  userRole: Role,
): { valid: true } | { valid: false; reason: string } {
  if (currentStatus === targetStatus) {
    return { valid: false, reason: `La commande est déjà au statut ${currentStatus}` };
  }

  const rules = ORDER_TRANSITIONS[currentStatus];
  if (!rules || rules.length === 0) {
    return {
      valid: false,
      reason: `La commande au statut ${currentStatus} ne peut plus être modifiée`,
    };
  }

  const matchingRule = rules.find((r) => r.to === targetStatus);
  if (!matchingRule) {
    const allowed = rules.map((r) => r.to).join(', ');
    return {
      valid: false,
      reason: `Transition ${currentStatus} → ${targetStatus} impossible. Transitions autorisées: ${allowed}`,
    };
  }

  if (!matchingRule.allowedRoles.includes(userRole)) {
    return {
      valid: false,
      reason: `Le rôle ${userRole} n'est pas autorisé à effectuer la transition ${currentStatus} → ${targetStatus}`,
    };
  }

  return { valid: true };
}

import { type Order } from './api/merchant';

export function getOrderAgeMs(order: Order): number {
  if (!order.createdAt) return Infinity;
  const age = Date.now() - new Date(order.createdAt).getTime();
  return age >= 0 ? age : Infinity;
}

export function isNewOrder(order: Order, thresholdMs: number): boolean {
  if (order.status !== 'PENDING') return false;
  return getOrderAgeMs(order) < thresholdMs;
}

export function countNewOrders(orders: Order[], thresholdMs: number): number {
  return orders.filter((o) => isNewOrder(o, thresholdMs)).length;
}

export function getOrderAgeLabel(order: Order): string {
  const age = getOrderAgeMs(order);
  if (age === Infinity) return '';
  const secs = Math.floor(age / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

/** Detect newly appeared order IDs between two snapshots */
export function detectNewOrderIds(prev: Order[], next: Order[]): string[] {
  const prevIds = new Set(prev.map((o) => o.id));
  return next
    .filter((o) => o.status === 'PENDING' && !prevIds.has(o.id))
    .map((o) => o.id);
}

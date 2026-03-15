import { type Order } from './api/merchant';

/* ── Date helpers ─────────────────────────────── */

export function isToday(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  try {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

/* ── Order filtering ──────────────────────────── */

const TERMINAL_STATUSES = ['DELIVERED', 'CANCELLED'];
const ACTIVE_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT'];

export function getTodayOrders(allOrders: Order[]): Order[] {
  return allOrders.filter((o) => isToday(o.createdAt));
}

export function getDeliveredToday(allOrders: Order[]): Order[] {
  return allOrders.filter((o) => o.status === 'DELIVERED' && isToday(o.createdAt));
}

export function getCancelledToday(allOrders: Order[]): Order[] {
  return allOrders.filter((o) => o.status === 'CANCELLED' && isToday(o.createdAt));
}

export function getActiveOrders(allOrders: Order[]): Order[] {
  return allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
}

/* ── Computed metrics ─────────────────────────── */

export interface DashboardMetrics {
  todayTotal: number;
  todayDelivered: number;
  todayCancelled: number;
  todayRevenue: number;
  avgBasket: number;
  activeCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  acceptedCount: number;
  conversionRate: number;
}

/**
 * Computes all dashboard metrics from a merged list of orders.
 * `allOrders` should be the deduplicated union of incoming + active + history.
 */
export function computeMetrics(
  pendingOrders: Order[],
  activeOrders: Order[],
  historyOrders: Order[],
): DashboardMetrics {
  const merged = deduplicateOrders([...pendingOrders, ...activeOrders, ...historyOrders]);

  const todayAll = getTodayOrders(merged);
  const delivered = todayAll.filter((o) => o.status === 'DELIVERED');
  const cancelled = todayAll.filter((o) => o.status === 'CANCELLED');

  const todayRevenue = delivered.reduce((s, o) => s + (o.total || 0), 0);
  const avgBasket = delivered.length > 0 ? Math.round(todayRevenue / delivered.length) : 0;

  const active = merged.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const accepted = active.filter((o) => o.status === 'ACCEPTED');
  const preparing = active.filter((o) => o.status === 'PREPARING');
  const ready = active.filter((o) => o.status === 'READY_FOR_PICKUP');
  const pending = active.filter((o) => o.status === 'PENDING');

  const conversionRate = todayAll.length > 0
    ? Math.round((delivered.length / todayAll.length) * 100)
    : 0;

  return {
    todayTotal: todayAll.length,
    todayDelivered: delivered.length,
    todayCancelled: cancelled.length,
    todayRevenue,
    avgBasket,
    activeCount: active.length,
    pendingCount: pending.length,
    preparingCount: accepted.length + preparing.length,
    readyCount: ready.length,
    acceptedCount: accepted.length,
    conversionRate,
  };
}

function deduplicateOrders(orders: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const o of orders) {
    const existing = map.get(o.id);
    if (!existing || TERMINAL_STATUSES.includes(o.status)) {
      map.set(o.id, o);
    }
  }
  return Array.from(map.values());
}

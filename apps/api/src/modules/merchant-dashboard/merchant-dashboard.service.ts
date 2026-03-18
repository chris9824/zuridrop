import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '@prisma/client';

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
];

export interface Last7DaysStats {
  ordersCount: number;
  revenue: number;
  delivered: number;
  cancelled: number;
}

export interface TopItem {
  name: string;
  quantity: number;
}

export interface DailyDataPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface DashboardStats {
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
  last7Days: Last7DaysStats;
  totalRevenue: number;
  topItems: TopItem[];
  dailyData: DailyDataPoint[];
}

@Injectable()
export class MerchantDashboardService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getStats(merchantId: string): Promise<DashboardStats> {
    const restaurantIds = await this.ordersService.getMerchantRestaurantIds(merchantId);

    if (restaurantIds.length === 0) {
      return this.emptyStats();
    }

    const { startOfDay, endOfDay } = this.getTodayRangeUTC();
    const { start7DaysAgo } = this.getLast7DaysRangeUTC();

    const allOrders = await this.prisma.order.findMany({
      where: { restaurantId: { in: restaurantIds } },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        delivery: { select: { deliveredAt: true } },
        items: {
          select: {
            quantity: true,
            menuItem: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isInTodayRange = (t: number) => t >= startOfDay && t <= endOfDay;
    const isInLast7Days = (t: number) => t >= start7DaysAgo && t <= endOfDay;

    const todayOrders = allOrders.filter((o) => isInTodayRange(o.createdAt.getTime()));

    const todayDelivered = allOrders.filter((o) => {
      if (o.status !== OrderStatus.DELIVERED) return false;
      const deliveredAt = o.delivery?.deliveredAt;
      const refTime = deliveredAt ? deliveredAt.getTime() : o.createdAt.getTime();
      return isInTodayRange(refTime);
    });
    const todayCancelled = todayOrders.filter((o) => o.status === OrderStatus.CANCELLED);
    const todayRevenue = todayDelivered.reduce((s, o) => s + o.total, 0);
    const avgBasket = todayDelivered.length > 0 ? Math.round(todayRevenue / todayDelivered.length) : 0;

    const last7DaysOrders = allOrders.filter((o) => isInLast7Days(o.createdAt.getTime()));
    const last7DaysDelivered = allOrders.filter((o) => {
      if (o.status !== OrderStatus.DELIVERED) return false;
      const deliveredAt = o.delivery?.deliveredAt;
      const refTime = deliveredAt ? deliveredAt.getTime() : o.createdAt.getTime();
      return isInLast7Days(refTime);
    });
    const last7DaysCancelled = last7DaysOrders.filter((o) => o.status === OrderStatus.CANCELLED);
    const last7DaysRevenue = last7DaysDelivered.reduce((s, o) => s + o.total, 0);

    const totalDeliveredOrders = allOrders.filter((o) => o.status === OrderStatus.DELIVERED);
    const totalRevenue = totalDeliveredOrders.reduce((s, o) => s + o.total, 0);

    const topItems = this.computeTopItems(allOrders, 5);

    const dailyData = this.computeDailyData(allOrders, start7DaysAgo);

    const activeOrders = allOrders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const pendingCount = activeOrders.filter((o) => o.status === OrderStatus.PENDING).length;
    const acceptedCount = activeOrders.filter((o) => o.status === OrderStatus.ACCEPTED).length;
    const preparingCount = activeOrders.filter((o) => o.status === OrderStatus.PREPARING).length;
    const readyCount = activeOrders.filter((o) => o.status === OrderStatus.READY_FOR_PICKUP).length;

    const conversionRate =
      todayOrders.length > 0
        ? Math.round((todayDelivered.length / todayOrders.length) * 100)
        : 0;

    return {
      todayTotal: todayOrders.length,
      todayDelivered: todayDelivered.length,
      todayCancelled: todayCancelled.length,
      todayRevenue,
      avgBasket,
      activeCount: activeOrders.length,
      pendingCount,
      preparingCount: acceptedCount + preparingCount,
      readyCount,
      acceptedCount,
      conversionRate,
      last7Days: {
        ordersCount: last7DaysOrders.length,
        revenue: last7DaysRevenue,
        delivered: last7DaysDelivered.length,
        cancelled: last7DaysCancelled.length,
      },
      totalRevenue,
      topItems,
      dailyData,
    };
  }

  private computeTopItems(
    orders: Array<{
      status: string;
      items: Array<{ quantity: number; menuItem: { name: string } }>;
    }>,
    limit: number,
  ): TopItem[] {
    const delivered = orders.filter((o) => o.status === OrderStatus.DELIVERED);
    const map = new Map<string, number>();
    for (const order of delivered) {
      for (const item of order.items) {
        const name = item.menuItem.name;
        map.set(name, (map.get(name) ?? 0) + item.quantity);
      }
    }
    return Array.from(map.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  private computeDailyData(
    orders: Array<{
      status: string;
      total: number;
      createdAt: Date;
      delivery?: { deliveredAt: Date | null } | null;
    }>,
    start7DaysAgo: number,
  ): DailyDataPoint[] {
    const result: DailyDataPoint[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i <= 6; i++) {
      const dayStart = start7DaysAgo + i * dayMs;
      const dayEnd = dayStart + dayMs - 1;
      const dayOrders = orders.filter((o) => {
        const t = o.createdAt.getTime();
        return t >= dayStart && t <= dayEnd;
      });
      const dayDelivered = orders.filter((o) => {
        if (o.status !== OrderStatus.DELIVERED) return false;
        const deliveredAt = o.delivery?.deliveredAt;
        const refTime = deliveredAt ? deliveredAt.getTime() : o.createdAt.getTime();
        return refTime >= dayStart && refTime <= dayEnd;
      });
      const date = new Date(dayStart);
      result.push({
        date: `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`,
        orders: dayOrders.length,
        revenue: dayDelivered.reduce((s, o) => s + o.total, 0),
      });
    }
    return result;
  }

  private getLast7DaysRangeUTC(): { start7DaysAgo: number; endOfDay: number } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const startOfToday = Date.UTC(year, month, day, 0, 0, 0, 0);
    const endOfDay = Date.UTC(year, month, day, 23, 59, 59, 999);
    const dayMs = 24 * 60 * 60 * 1000;
    const start7DaysAgo = startOfToday - 6 * dayMs;
    return { start7DaysAgo, endOfDay };
  }

  /**
   * Returns start/end of "today" in UTC.
   * Uses UTC to avoid timezone mismatches when server runs in a different TZ than the merchant.
   * For Côte d'Ivoire (UTC+0) and most deployments (UTC), this correctly represents "today".
   */
  private getTodayRangeUTC(): { startOfDay: number; endOfDay: number } {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();
    const startOfDay = Date.UTC(year, month, day, 0, 0, 0, 0);
    const endOfDay = Date.UTC(year, month, day, 23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  private emptyStats(): DashboardStats {
    return {
      todayTotal: 0,
      todayDelivered: 0,
      todayCancelled: 0,
      todayRevenue: 0,
      avgBasket: 0,
      activeCount: 0,
      pendingCount: 0,
      preparingCount: 0,
      readyCount: 0,
      acceptedCount: 0,
      conversionRate: 0,
      last7Days: { ordersCount: 0, revenue: 0, delivered: 0, cancelled: 0 },
      totalRevenue: 0,
      topItems: [],
      dailyData: [],
    };
  }
}

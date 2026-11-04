import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { OrderStatus, Prisma, Role } from '@prisma/client';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_TRANSIT,
];

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalOrders,
      ordersToday,
      totalRevenue,
      revenueToday,
      totalRestaurants,
      totalDrivers,
      totalCustomers,
      activeOrdersCount,
      ordersLast7Days,
      recentOrders,
      recentRestaurants,
      recentDrivers,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: { gte: startOfToday },
        },
        _sum: { total: true },
      }),
      this.prisma.restaurant.count(),
      this.prisma.user.count({ where: { role: Role.DRIVER } }),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.order.count({
        where: { status: { in: ACTIVE_ORDER_STATUSES } },
      }),
      this.getOrdersByDay(7),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          restaurant: { select: { id: true, name: true } },
          delivery: {
            include: {
              driver: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.restaurant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, city: true, isOpen: true, createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { role: Role.DRIVER },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, email: true, isOnline: true, createdAt: true },
      }),
    ]);

    return {
      kpis: {
        totalOrders,
        ordersToday,
        totalRevenue: totalRevenue._sum.total ?? 0,
        revenueToday: revenueToday._sum.total ?? 0,
        totalRestaurants,
        totalDrivers,
        totalCustomers,
        activeOrdersCount,
      },
      ordersLast7Days,
      recentOrders,
      recentRestaurants,
      recentDrivers,
    };
  }

  private async getOrdersByDay(days: number) {
    const result: { date: string; count: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [count, agg] = await Promise.all([
        this.prisma.order.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
        this.prisma.order.aggregate({
          where: {
            status: { not: OrderStatus.CANCELLED },
            createdAt: { gte: start, lt: end },
          },
          _sum: { total: true },
        }),
      ]);

      result.push({
        date: start.toISOString().slice(0, 10),
        count,
        revenue: agg._sum.total ?? 0,
      });
    }

    return result;
  }

  async getOrders(page = 1, limit = 20, status?: string, q?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (q?.trim()) {
      where.OR = [
        { id: { contains: q, mode: 'insensitive' } },
        { customer: { firstName: { contains: q, mode: 'insensitive' } } },
        { customer: { lastName: { contains: q, mode: 'insensitive' } } },
        { customer: { email: { contains: q, mode: 'insensitive' } } },
        { restaurant: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          restaurant: { select: { id: true, name: true } },
          delivery: {
            include: {
              driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRestaurants(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (q?.trim()) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { cuisineType: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { orders: true } },
          orders: {
            where: { status: { not: OrderStatus.CANCELLED } },
            select: { total: true },
          },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    const enriched = data.map((r) => {
      const revenue = r.orders.reduce((s, o) => s + o.total, 0);
      const { orders, _count, ...rest } = r;
      return {
        ...rest,
        ordersCount: _count.orders,
        revenue,
      };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDrivers(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { role: Role.DRIVER };
    if (q?.trim()) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isOnline: true,
          availability: true,
          isActive: true,
          createdAt: true,
          _count: { select: { deliveries: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const enriched = data.map((u) => {
      const { _count, ...rest } = u;
      return { ...rest, deliveriesCount: _count.deliveries };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCustomers(page = 1, limit = 20, q?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { role: Role.CUSTOMER };
    if (q?.trim()) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const enriched = data.map((u) => {
      const { _count, ...rest } = u;
      return { ...rest, ordersCount: _count.orders };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

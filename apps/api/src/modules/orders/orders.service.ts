import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus, PaymentMethod, Role } from '@prisma/client';
import { validateTransition } from '../../common/utils/order-transitions';
import { isRestaurantOpenNow } from '../../common/utils/restaurant-hours';
import { DispatchService } from '../delivery/dispatch.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private dispatchService: DispatchService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto) {
    // Validate restaurant exists and is open
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant non trouvé');
    if (!isRestaurantOpenNow(restaurant)) {
      throw new BadRequestException('Le restaurant est fermé');
    }

    // Fetch menu items and compute prices
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: dto.restaurantId, isAvailable: true },
    });

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('Un ou plusieurs articles ne sont pas disponibles');
    }

    const menuItemMap = new Map(menuItems.map((m: { id: string; price: number }) => [m.id, m]));

    let subtotal = 0;
    const orderItems = dto.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const total = menuItem.price * item.quantity;
      subtotal += total;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        total,
      };
    });

    const deliveryFee = 500; // Fixed delivery fee (simple)
    const total = subtotal + deliveryFee;

    const order = await this.prisma.order.create({
      data: {
        customerId,
        restaurantId: dto.restaurantId,
        deliveryAddressId: dto.deliveryAddressId,
        paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
        notes: dto.notes,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { id: true, name: true } },
      },
    });

    return order;
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sort = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          restaurant: { select: { id: true, name: true } },
          delivery: true,
        },
      }),
      this.prisma.order.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findMine(customerId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, sort = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where = { customerId };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: {
          items: { include: { menuItem: true } },
          restaurant: { select: { id: true, name: true } },
          delivery: {
            include: {
              driver: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findRestaurantOrders(merchantId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, sort = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const restaurantIds = await this.getMerchantRestaurantIds(merchantId);

    const where = { restaurantId: { in: restaurantIds } };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: {
          items: { include: { menuItem: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          delivery: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: string, userRole?: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        restaurant: { select: { id: true, name: true, merchantId: true } },
        deliveryAddress: true,
        delivery: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Commande non trouvée');

    // Privacy: customers can only see their own orders
    if (userRole === Role.CUSTOMER && order.customerId !== userId) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Privacy: merchants can only see orders from their restaurants
    if (userRole === Role.MERCHANT && order.restaurant.merchantId !== userId) {
      throw new NotFoundException('Commande non trouvée');
    }

    return order;
  }

  /**
   * Central status update with transition validation.
   * Used by both the generic PUT /orders/:id/status and merchant wrappers.
   */
  async updateStatus(userId: string, userRole: Role, orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) throw new NotFoundException('Commande non trouvée');

    // Merchant can only update their own restaurant orders
    if (userRole === Role.MERCHANT && order.restaurant.merchantId !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos commandes restaurant');
    }

    // Validate transition
    const result = validateTransition(order.status, dto.status, userRole);
    if (!result.valid) {
      throw new BadRequestException(result.reason);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      include: {
        items: { include: { menuItem: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        delivery: {
          include: {
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      const dispatchResult = await this.dispatchService.dispatchOrder(orderId);
      this.logger.log(`Auto-dispatch pour commande ${orderId}: ${dispatchResult.dispatched ? 'OK → ' + dispatchResult.driverName : dispatchResult.reason}`);

      if (dispatchResult.dispatched) {
        const refreshed = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: { include: { menuItem: true } },
            customer: { select: { id: true, firstName: true, lastName: true, email: true } },
            restaurant: { select: { id: true, name: true } },
            delivery: {
              include: {
                driver: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        });
        return refreshed ?? updated;
      }
    }

    return updated;
  }

  // ─── Helpers réutilisés par MerchantOrdersService ──────

  /**
   * Returns restaurant IDs belonging to a merchant.
   */
  async getMerchantRestaurantIds(merchantId: string): Promise<string[]> {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { merchantId },
      select: { id: true },
    });
    return restaurants.map((r: { id: string }) => r.id);
  }

  /**
   * Verifies that an order belongs to one of the merchant's restaurants.
   * Returns the order if valid, throws ForbiddenException otherwise.
   */
  async getOrderForMerchant(merchantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        items: { include: { menuItem: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        deliveryAddress: true,
        delivery: true,
      },
    });
    if (!order) throw new NotFoundException('Commande non trouvée');

    if (order.restaurant.merchantId !== merchantId) {
      throw new ForbiddenException('Cette commande ne fait pas partie de vos restaurants');
    }

    return order;
  }
}

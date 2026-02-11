import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { MerchantOrderFilterDto } from './dto';

/** Standard includes for merchant order queries */
const MERCHANT_ORDER_INCLUDE = {
  items: { include: { menuItem: true } },
  customer: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
  restaurant: { select: { id: true, name: true } },
  deliveryAddress: true,
  delivery: true,
};

@Injectable()
export class MerchantOrdersService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  /**
   * GET /merchant/orders/incoming
   * Nouvelles commandes à traiter (PENDING par défaut).
   */
  async getIncoming(merchantId: string, filter: MerchantOrderFilterDto) {
    const statuses = filter.statuses?.length
      ? filter.statuses
      : [OrderStatus.PENDING];

    return this.queryOrders(merchantId, statuses, filter);
  }

  /**
   * GET /merchant/orders/active
   * Commandes en cours de préparation (ACCEPTED, PREPARING par défaut).
   */
  async getActive(merchantId: string, filter: MerchantOrderFilterDto) {
    const statuses = filter.statuses?.length
      ? filter.statuses
      : [OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP];

    return this.queryOrders(merchantId, statuses, filter);
  }

  /**
   * PATCH /merchant/orders/:orderId/accept
   * PENDING → ACCEPTED
   */
  async accept(merchantId: string, orderId: string) {
    // Ownership check
    await this.ordersService.getOrderForMerchant(merchantId, orderId);
    return this.ordersService.updateStatus(
      merchantId,
      Role.MERCHANT,
      orderId,
      { status: OrderStatus.ACCEPTED },
    );
  }

  /**
   * PATCH /merchant/orders/:orderId/start-preparing
   * ACCEPTED → PREPARING
   */
  async startPreparing(merchantId: string, orderId: string) {
    await this.ordersService.getOrderForMerchant(merchantId, orderId);
    return this.ordersService.updateStatus(
      merchantId,
      Role.MERCHANT,
      orderId,
      { status: OrderStatus.PREPARING },
    );
  }

  /**
   * PATCH /merchant/orders/:orderId/ready-for-pickup
   * PREPARING → READY_FOR_PICKUP
   */
  async readyForPickup(merchantId: string, orderId: string) {
    await this.ordersService.getOrderForMerchant(merchantId, orderId);
    return this.ordersService.updateStatus(
      merchantId,
      Role.MERCHANT,
      orderId,
      { status: OrderStatus.READY_FOR_PICKUP },
    );
  }

  /**
   * PATCH /merchant/orders/:orderId/cancel
   * PENDING|ACCEPTED → CANCELLED (avec raison optionnelle)
   */
  async cancel(merchantId: string, orderId: string, reason?: string) {
    const order = await this.ordersService.getOrderForMerchant(merchantId, orderId);

    // Only allow cancel from PENDING or ACCEPTED
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.ACCEPTED];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Impossible d'annuler une commande au statut ${order.status}. Annulation possible uniquement depuis PENDING ou ACCEPTED.`,
      );
    }

    const updated = await this.ordersService.updateStatus(
      merchantId,
      Role.MERCHANT,
      orderId,
      { status: OrderStatus.CANCELLED },
    );

    // Persist cancellation reason in notes if provided
    if (reason) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { notes: reason },
      });
    }

    return { ...updated, cancellationReason: reason || null };
  }

  // ─── Private helper ────────────────────────────────

  private async queryOrders(
    merchantId: string,
    statuses: OrderStatus[],
    filter: MerchantOrderFilterDto,
  ) {
    const { page = 1, limit = 20, sort = 'desc' } = filter;
    const skip = (page - 1) * limit;

    const restaurantIds = await this.ordersService.getMerchantRestaurantIds(merchantId);

    if (restaurantIds.length === 0) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const where = {
      restaurantId: { in: restaurantIds },
      status: { in: statuses },
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: MERCHANT_ORDER_INCLUDE,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

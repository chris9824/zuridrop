import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpdateLocationDto, UpdateDeliveryStatusDto } from './dto';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

/** Standard includes for delivery queries */
const DELIVERY_INCLUDE = {
  order: {
    include: {
      items: { include: { menuItem: true } },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      restaurant: { select: { id: true, name: true, street: true, city: true, latitude: true, longitude: true } },
      deliveryAddress: true,
    },
  },
};

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  // ─── Driver Status ──────────────────────────────────

  async toggleOnline(driverId: string) {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data: { isOnline: !driver.isOnline },
    });

    return { isOnline: updated.isOnline };
  }

  async updateLocation(driverId: string, dto: UpdateLocationDto) {
    await this.prisma.user.update({
      where: { id: driverId },
      data: {
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    return { message: 'Position mise à jour', ...dto };
  }

  // ─── Queries ────────────────────────────────────────

  async getActiveDelivery(driverId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        driverId,
        status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT] },
      },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return delivery;
  }

  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_PICKUP,
        delivery: null,
      },
      include: {
        items: { include: { menuItem: true } },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        restaurant: { select: { id: true, name: true, street: true, city: true, latitude: true, longitude: true } },
        deliveryAddress: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Action-based endpoints ─────────────────────────

  /**
   * POST /delivery/:orderId/assign
   * Creates a new Delivery record and assigns it to the driver.
   */
  async assignToDriver(driverId: string, orderId: string) {
    // 1. Verify order exists and is READY_FOR_PICKUP
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Commande non trouvée');

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `La commande doit être au statut READY_FOR_PICKUP pour être assignée (statut actuel: ${order.status})`,
      );
    }

    // 2. Check driver doesn't already have an active delivery
    const activeDelivery = await this.getActiveDelivery(driverId);
    if (activeDelivery) {
      throw new ConflictException(
        'Vous avez déjà une livraison en cours. Terminez-la avant d\'en accepter une nouvelle.',
      );
    }

    // 3. Create delivery inside transaction — unique constraint on orderId
    //    prevents double-assign even under race conditions
    try {
      const delivery = await this.prisma.$transaction(async (tx) => {
        // Re-check inside transaction for safety
        const existing = await tx.delivery.findUnique({ where: { orderId } });
        if (existing) {
          throw new ConflictException('Une livraison est déjà assignée à cette commande');
        }

        return tx.delivery.create({
          data: {
            orderId,
            driverId,
            status: DeliveryStatus.ASSIGNED,
            deliveryFee: order.deliveryFee,
          },
          include: DELIVERY_INCLUDE,
        });
      });

      return delivery;
    } catch (error: any) {
      // Catch Prisma unique constraint violation (P2002) for race condition
      if (error?.code === 'P2002') {
        throw new ConflictException('Cette commande vient d\'être assignée à un autre driver');
      }
      throw error;
    }
  }

  /**
   * POST /delivery/:orderId/pickup
   * ASSIGNED → PICKED_UP
   */
  async pickupOrder(driverId: string, orderId: string) {
    const delivery = await this.getDriverDelivery(driverId, orderId);

    this.assertDeliveryStatus(delivery.status, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP);

    // Atomic: order FIRST so delivery include reflects fresh order status
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PICKED_UP },
      });

      return tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.PICKED_UP,
          pickedUpAt: new Date(),
        },
        include: DELIVERY_INCLUDE,
      });
    });

    return updated;
  }

  /**
   * POST /delivery/:orderId/start
   * PICKED_UP → IN_TRANSIT
   */
  async startDelivery(driverId: string, orderId: string) {
    const delivery = await this.getDriverDelivery(driverId, orderId);

    this.assertDeliveryStatus(delivery.status, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT);

    // Atomic: order FIRST so delivery include reflects fresh order status
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.IN_TRANSIT },
      });

      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.IN_TRANSIT },
        include: DELIVERY_INCLUDE,
      });
    });

    return updated;
  }

  /**
   * POST /delivery/:orderId/complete
   * IN_TRANSIT → DELIVERED
   */
  async completeDelivery(driverId: string, orderId: string) {
    const delivery = await this.getDriverDelivery(driverId, orderId);

    this.assertDeliveryStatus(delivery.status, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);

    // Atomic: order FIRST so delivery include reflects fresh order status
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      return tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
        },
        include: DELIVERY_INCLUDE,
      });
    });

    return updated;
  }

  // ─── Legacy endpoint (backward compat) ─────────────

  async updateDeliveryStatus(driverId: string, orderId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.getDriverDelivery(driverId, orderId);

    // Validate transition sequence
    const DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus | null> = {
      [DeliveryStatus.ASSIGNED]: DeliveryStatus.PICKED_UP,
      [DeliveryStatus.PICKED_UP]: DeliveryStatus.IN_TRANSIT,
      [DeliveryStatus.IN_TRANSIT]: DeliveryStatus.DELIVERED,
      [DeliveryStatus.DELIVERED]: null,
    };

    const expectedNext = DELIVERY_TRANSITIONS[delivery.status];
    if (!expectedNext || dto.status !== expectedNext) {
      throw new BadRequestException(
        `Transition ${delivery.status} → ${dto.status} impossible. ` +
        (expectedNext
          ? `Prochaine étape attendue: ${expectedNext}`
          : `La livraison est déjà terminée.`),
      );
    }

    // Build delivery update data
    const updateData: Record<string, any> = { status: dto.status };
    if (dto.status === DeliveryStatus.PICKED_UP) updateData.pickedUpAt = new Date();
    if (dto.status === DeliveryStatus.DELIVERED) updateData.deliveredAt = new Date();

    // Map delivery status → order status
    const DELIVERY_TO_ORDER: Partial<Record<DeliveryStatus, OrderStatus>> = {
      [DeliveryStatus.PICKED_UP]: OrderStatus.PICKED_UP,
      [DeliveryStatus.IN_TRANSIT]: OrderStatus.IN_TRANSIT,
      [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
    };

    const orderStatus = DELIVERY_TO_ORDER[dto.status];

    // Atomic transaction: order FIRST so delivery include reflects fresh status
    const updated = await this.prisma.$transaction(async (tx) => {
      if (orderStatus) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: orderStatus },
        });
      }

      return tx.delivery.update({
        where: { id: delivery.id },
        data: updateData,
        include: DELIVERY_INCLUDE,
      });
    });

    return updated;
  }

  // ─── Earnings ───────────────────────────────────────

  async getEarnings(driverId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { driverId, status: DeliveryStatus.DELIVERED },
    });

    const totalEarnings = deliveries.reduce((sum: number, d) => sum + d.deliveryFee, 0);
    const totalDeliveries = deliveries.length;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayDeliveries = await this.prisma.delivery.findMany({
      where: {
        driverId,
        status: DeliveryStatus.DELIVERED,
        deliveredAt: { gte: todayStart },
      },
    });

    const todayEarnings = todayDeliveries.reduce((sum: number, d) => sum + d.deliveryFee, 0);

    return {
      totalEarnings,
      totalDeliveries,
      todayEarnings,
      todayDeliveries: todayDeliveries.length,
    };
  }

  // ─── Private Helpers ────────────────────────────────

  /**
   * Fetches a delivery for a specific driver+order, with ownership check.
   */
  private async getDriverDelivery(driverId: string, orderId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId },
    });

    if (!delivery) {
      throw new NotFoundException(
        'Livraison non trouvée. Assignez-vous d\'abord via POST /delivery/{orderId}/assign',
      );
    }

    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('Cette livraison ne vous est pas assignée');
    }

    return delivery;
  }

  /**
   * Validates that the delivery is in the expected status before transitioning.
   */
  private assertDeliveryStatus(
    current: DeliveryStatus,
    expected: DeliveryStatus,
    target: DeliveryStatus,
  ) {
    if (current !== expected) {
      throw new BadRequestException(
        `Transition ${current} → ${target} impossible. La livraison doit être au statut ${expected}.`,
      );
    }
  }
}

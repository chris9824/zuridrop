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

const ACTIVE_STATUSES = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.ACCEPTED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

const DELIVERY_INCLUDE = {
  order: {
    include: {
      items: { include: { menuItem: true } },
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      restaurant: { select: { id: true, name: true, street: true, city: true, latitude: true, longitude: true } },
      deliveryAddress: true,
    },
  },
  driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
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
      data: { latitude: dto.latitude, longitude: dto.longitude },
    });
    return { message: 'Position mise à jour', ...dto };
  }

  // ─── Queries ────────────────────────────────────────

  async getActiveDelivery(driverId: string) {
    return this.prisma.delivery.findFirst({
      where: { driverId, status: { in: ACTIVE_STATUSES } },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverDeliveries(driverId: string) {
    return this.prisma.delivery.findMany({
      where: { driverId },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeliveryById(driverId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: DELIVERY_INCLUDE,
    });
    if (!delivery) throw new NotFoundException('Livraison non trouvée');
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('Cette livraison ne vous est pas assignée');
    }
    return delivery;
  }

  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: { status: OrderStatus.READY_FOR_PICKUP, delivery: null },
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

  async assignToDriver(driverId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande non trouvée');

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `La commande doit être au statut READY_FOR_PICKUP (statut actuel: ${order.status})`,
      );
    }

    const activeDelivery = await this.getActiveDelivery(driverId);
    if (activeDelivery) {
      throw new ConflictException(
        'Vous avez déjà une livraison en cours. Terminez-la avant d\'en accepter une nouvelle.',
      );
    }

    try {
      const delivery = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.delivery.findUnique({ where: { orderId } });
        if (existing) throw new ConflictException('Une livraison est déjà assignée à cette commande');

        return tx.delivery.create({
          data: {
            orderId,
            driverId,
            status: DeliveryStatus.ASSIGNED,
            deliveryFee: order.deliveryFee,
            assignedAt: new Date(),
          },
          include: DELIVERY_INCLUDE,
        });
      });
      return delivery;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Cette commande vient d\'être assignée à un autre driver');
      }
      throw error;
    }
  }

  /**
   * ASSIGNED → ACCEPTED
   * The driver confirms they will handle the delivery.
   */
  async acceptDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED);

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: DeliveryStatus.ACCEPTED, acceptedAt: new Date() },
      include: DELIVERY_INCLUDE,
    });
  }

  /**
   * ACCEPTED → PICKED_UP (also updates Order.status)
   */
  async pickupDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.PICKED_UP },
      });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.PICKED_UP, pickedUpAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  /**
   * PICKED_UP → IN_TRANSIT (also updates Order.status)
   */
  async startDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.IN_TRANSIT },
      });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.IN_TRANSIT, startedAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  /**
   * IN_TRANSIT → DELIVERED (also updates Order.status)
   */
  async completeDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERED },
      });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  /**
   * ASSIGNED|ACCEPTED → CANCELLED
   * Only allowed before pickup. Frees the driver.
   */
  async cancelDelivery(driverId: string, deliveryId: string, reason?: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);

    if (delivery.status !== DeliveryStatus.ASSIGNED && delivery.status !== DeliveryStatus.ACCEPTED) {
      throw new BadRequestException(
        `Impossible d'annuler une livraison au statut ${delivery.status}. Annulation possible uniquement avant le ramassage.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.READY_FOR_PICKUP },
      });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: {
          status: DeliveryStatus.CANCELLED,
          cancelledAt: new Date(),
          notes: reason || undefined,
        },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  // ─── Legacy (backward compat) ─────────────────────

  async pickupOrderLegacy(driverId: string, orderId: string) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);
    this.assertStatus(delivery.status, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PICKED_UP } });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.PICKED_UP, pickedUpAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  async startDeliveryLegacy(driverId: string, orderId: string) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);
    this.assertStatus(delivery.status, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.IN_TRANSIT } });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.IN_TRANSIT, startedAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  async completeDeliveryLegacy(driverId: string, orderId: string) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);
    this.assertStatus(delivery.status, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.DELIVERED } });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });
  }

  async updateDeliveryStatus(driverId: string, orderId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);

    const TRANSITIONS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
      [DeliveryStatus.ASSIGNED]: DeliveryStatus.PICKED_UP,
      [DeliveryStatus.PICKED_UP]: DeliveryStatus.IN_TRANSIT,
      [DeliveryStatus.IN_TRANSIT]: DeliveryStatus.DELIVERED,
    };

    const expectedNext = TRANSITIONS[delivery.status];
    if (!expectedNext || dto.status !== expectedNext) {
      throw new BadRequestException(
        `Transition ${delivery.status} → ${dto.status} impossible.` +
        (expectedNext ? ` Prochaine étape: ${expectedNext}` : ' Livraison terminée.'),
      );
    }

    const updateData: Record<string, any> = { status: dto.status };
    if (dto.status === DeliveryStatus.PICKED_UP) updateData.pickedUpAt = new Date();
    if (dto.status === DeliveryStatus.IN_TRANSIT) updateData.startedAt = new Date();
    if (dto.status === DeliveryStatus.DELIVERED) updateData.deliveredAt = new Date();

    const ORDER_MAP: Partial<Record<DeliveryStatus, OrderStatus>> = {
      [DeliveryStatus.PICKED_UP]: OrderStatus.PICKED_UP,
      [DeliveryStatus.IN_TRANSIT]: OrderStatus.IN_TRANSIT,
      [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
    };

    const orderStatus = ORDER_MAP[dto.status];

    return this.prisma.$transaction(async (tx) => {
      if (orderStatus) {
        await tx.order.update({ where: { id: orderId }, data: { status: orderStatus } });
      }
      return tx.delivery.update({
        where: { id: delivery.id },
        data: updateData,
        include: DELIVERY_INCLUDE,
      });
    });
  }

  // ─── Earnings ───────────────────────────────────────

  async getEarnings(driverId: string) {
    const deliveries = await this.prisma.delivery.findMany({
      where: { driverId, status: DeliveryStatus.DELIVERED },
    });

    const totalEarnings = deliveries.reduce((sum: number, d) => sum + d.deliveryFee, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayDeliveries = await this.prisma.delivery.findMany({
      where: { driverId, status: DeliveryStatus.DELIVERED, deliveredAt: { gte: todayStart } },
    });

    return {
      totalEarnings,
      totalDeliveries: deliveries.length,
      todayEarnings: todayDeliveries.reduce((sum: number, d) => sum + d.deliveryFee, 0),
      todayDeliveries: todayDeliveries.length,
    };
  }

  // ─── Private Helpers ────────────────────────────────

  private async getOwnedDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Livraison non trouvée');
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('Cette livraison ne vous est pas assignée');
    }
    return delivery;
  }

  private async getDriverDeliveryByOrder(driverId: string, orderId: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { orderId } });
    if (!delivery) {
      throw new NotFoundException('Livraison non trouvée. Assignez-vous d\'abord via POST /delivery/{orderId}/assign');
    }
    if (delivery.driverId !== driverId) {
      throw new ForbiddenException('Cette livraison ne vous est pas assignée');
    }
    return delivery;
  }

  private assertStatus(current: DeliveryStatus, expected: DeliveryStatus, target: DeliveryStatus) {
    if (current !== expected) {
      throw new BadRequestException(
        `Transition ${current} → ${target} impossible. Statut attendu: ${expected}.`,
      );
    }
  }
}

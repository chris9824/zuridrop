import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpdateLocationDto, UpdateDeliveryStatusDto, UpdateAvailabilityDto, DriverAvailabilityInput } from './dto';
import { DeliveryStatus, DriverAvailability, OrderStatus } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { TrackingService } from './tracking.service';

const ACTIVE_STATUSES: DeliveryStatus[] = [
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
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private prisma: PrismaService,
    private dispatchService: DispatchService,
    private trackingService: TrackingService,
  ) {}

  // ─── Driver Availability ────────────────────────────

  async setAvailability(driverId: string, dto: UpdateAvailabilityDto) {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver non trouvé');

    const target = dto.availability as string as DriverAvailability;

    if (target === DriverAvailability.OFFLINE) {
      const activeDelivery = await this.prisma.delivery.findFirst({
        where: { driverId, status: { in: ACTIVE_STATUSES } },
      });
      if (activeDelivery) {
        throw new BadRequestException(
          'Impossible de passer hors ligne avec une livraison en cours. Terminez ou annulez votre livraison d\'abord.',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data: {
        availability: target,
        isOnline: target !== DriverAvailability.OFFLINE,
      },
    });

    return {
      availability: updated.availability,
      isOnline: updated.isOnline,
    };
  }

  // ─── Driver Status (legacy compat) ──────────────────

  async toggleOnline(driverId: string) {
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver non trouvé');

    const goingOnline = !driver.isOnline;

    if (!goingOnline) {
      const activeDelivery = await this.prisma.delivery.findFirst({
        where: { driverId, status: { in: ACTIVE_STATUSES } },
      });
      if (activeDelivery) {
        throw new BadRequestException(
          'Impossible de passer hors ligne avec une livraison en cours.',
        );
      }
    }

    const newAvailability = goingOnline
      ? DriverAvailability.AVAILABLE
      : DriverAvailability.OFFLINE;

    const updated = await this.prisma.user.update({
      where: { id: driverId },
      data: { isOnline: goingOnline, availability: newAvailability },
    });

    return { isOnline: updated.isOnline, availability: updated.availability };
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
      where: { driverId, status: { in: ACTIVE_STATUSES } },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverHistory(driverId: string) {
    return this.prisma.delivery.findMany({
      where: {
        driverId,
        status: { in: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED] },
      },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
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
    const driver = await this.prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver non trouvé');
    if (driver.availability === DriverAvailability.OFFLINE) {
      throw new BadRequestException('Vous êtes hors ligne. Passez en AVAILABLE d\'abord.');
    }
    if (driver.availability === DriverAvailability.BUSY) {
      throw new ConflictException('Vous avez déjà une livraison en cours.');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande non trouvée');

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(
        `La commande doit être au statut READY_FOR_PICKUP (statut actuel: ${order.status})`,
      );
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 120_000);

      const delivery = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.delivery.findUnique({ where: { orderId } });
        if (existing && ACTIVE_STATUSES.includes(existing.status)) {
          throw new ConflictException('Une livraison active est déjà assignée à cette commande');
        }
        if (existing) {
          await tx.delivery.delete({ where: { id: existing.id } });
        }

        await tx.user.update({
          where: { id: driverId },
          data: { availability: DriverAvailability.BUSY },
        });

        return tx.delivery.create({
          data: {
            orderId,
            driverId,
            status: DeliveryStatus.ASSIGNED,
            deliveryFee: order.deliveryFee,
            assignedAt: now,
            assignmentExpiresAt: expiresAt,
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
   * Checks assignment expiration before accepting.
   */
  async acceptDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED);

    if (this.isExpired(delivery)) {
      this.logger.warn(`Driver ${driverId} tente d'accepter la delivery ${deliveryId} mais elle a expiré`);

      await this.handleExpiration(delivery);

      throw new BadRequestException(
        'Le délai d\'acceptation a expiré. La livraison a été réassignée à un autre livreur.',
      );
    }

    return this.prisma.delivery.update({
      where: { id: delivery.id },
      data: { status: DeliveryStatus.ACCEPTED, acceptedAt: new Date() },
      include: DELIVERY_INCLUDE,
    });
  }

  /**
   * ASSIGNED → REJECTED (driver refuses the delivery)
   * Deletes the delivery record and re-dispatches to another driver.
   */
  async rejectDelivery(driverId: string, deliveryId: string, reason?: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);

    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException(
        `Refus impossible : la livraison est au statut ${delivery.status}. ` +
        'Le refus n\'est autorisé qu\'au statut ASSIGNED.',
      );
    }

    const orderId = delivery.orderId;

    this.logger.log(
      `Driver ${driverId} refuse la livraison ${deliveryId} pour commande ${orderId}. Raison: ${reason || 'non précisée'}`,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.delete({ where: { id: delivery.id } });

      await tx.user.update({
        where: { id: driverId },
        data: { availability: DriverAvailability.AVAILABLE },
      });
    });

    const redispatch = await this.dispatchService.dispatchOrder(orderId, [driverId]);
    this.logger.log(
      `Re-dispatch après refus pour commande ${orderId}: ${redispatch.dispatched ? 'OK → ' + redispatch.driverName : redispatch.reason}`,
    );

    return {
      message: 'Livraison refusée',
      reason: reason || undefined,
      redispatch: {
        dispatched: redispatch.dispatched,
        driverName: redispatch.driverName || null,
        reason: redispatch.reason || null,
      },
    };
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
   * Starts the live tracking simulation.
   */
  async startDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT);

    const result = await this.prisma.$transaction(async (tx) => {
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

    this.trackingService.startSimulation(delivery.orderId, delivery.id).catch((err) => {
      this.logger.error(`Failed to start tracking simulation for order ${delivery.orderId}: ${err.message}`);
    });

    return result;
  }

  /**
   * IN_TRANSIT → DELIVERED (also updates Order.status)
   * Marks driver back to AVAILABLE. Stops tracking simulation.
   */
  async completeDelivery(driverId: string, deliveryId: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);
    this.assertStatus(delivery.status, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);

    this.trackingService.stopSimulation(delivery.orderId);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      await tx.user.update({
        where: { id: driverId },
        data: { availability: DriverAvailability.AVAILABLE },
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
   * Only allowed before pickup. Frees the driver and re-dispatches.
   */
  async cancelDelivery(driverId: string, deliveryId: string, reason?: string) {
    const delivery = await this.getOwnedDelivery(driverId, deliveryId);

    if (delivery.status !== DeliveryStatus.ASSIGNED && delivery.status !== DeliveryStatus.ACCEPTED) {
      throw new BadRequestException(
        `Impossible d'annuler une livraison au statut ${delivery.status}. ` +
        'Annulation possible uniquement avant le ramassage.',
      );
    }

    const orderId = delivery.orderId;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: OrderStatus.READY_FOR_PICKUP },
      });

      await tx.user.update({
        where: { id: driverId },
        data: { availability: DriverAvailability.AVAILABLE },
      });

      await tx.delivery.delete({ where: { id: delivery.id } });

      return { orderId };
    });

    const redispatch = await this.dispatchService.dispatchOrder(result.orderId, [driverId]);
    this.logger.log(
      `Re-dispatch après annulation pour commande ${orderId}: ${redispatch.dispatched ? 'OK → ' + redispatch.driverName : redispatch.reason}`,
    );

    return {
      message: 'Livraison annulée',
      reason: reason || undefined,
      redispatch: {
        dispatched: redispatch.dispatched,
        driverName: redispatch.driverName || null,
        reason: redispatch.reason || null,
      },
    };
  }

  // ─── Legacy (backward compat) ─────────────────────

  async pickupOrderLegacy(driverId: string, orderId: string) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);
    this.assertStatus(delivery.status, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP);

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

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.IN_TRANSIT } });
      return tx.delivery.update({
        where: { id: delivery.id },
        data: { status: DeliveryStatus.IN_TRANSIT, startedAt: new Date() },
        include: DELIVERY_INCLUDE,
      });
    });

    this.trackingService.startSimulation(orderId, delivery.id).catch((err) => {
      this.logger.error(`Failed to start tracking simulation for order ${orderId}: ${err.message}`);
    });

    return result;
  }

  async completeDeliveryLegacy(driverId: string, orderId: string) {
    const delivery = await this.getDriverDeliveryByOrder(driverId, orderId);
    this.assertStatus(delivery.status, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);

    this.trackingService.stopSimulation(orderId);

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.DELIVERED } });

      await tx.user.update({
        where: { id: driverId },
        data: { availability: DriverAvailability.AVAILABLE },
      });

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
      if (dto.status === DeliveryStatus.DELIVERED) {
        await tx.user.update({
          where: { id: driverId },
          data: { availability: DriverAvailability.AVAILABLE },
        });
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
    const delivery = await this.prisma.delivery.findFirst({
      where: { orderId, status: { in: ACTIVE_STATUSES } },
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

  private assertStatus(current: DeliveryStatus, expected: DeliveryStatus, target: DeliveryStatus) {
    if (current !== expected) {
      throw new BadRequestException(
        `Transition ${current} → ${target} impossible. Statut attendu: ${expected}.`,
      );
    }
  }

  private isExpired(delivery: { assignmentExpiresAt: Date | null }): boolean {
    if (!delivery.assignmentExpiresAt) return false;
    return new Date() > delivery.assignmentExpiresAt;
  }

  /**
   * Handles an expired delivery: deletes it, frees the driver, and re-dispatches.
   */
  private async handleExpiration(delivery: { id: string; orderId: string; driverId: string }) {
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.delete({ where: { id: delivery.id } });
      await tx.user.update({
        where: { id: delivery.driverId },
        data: { availability: DriverAvailability.AVAILABLE },
      });
    });

    const result = await this.dispatchService.dispatchOrder(delivery.orderId, [delivery.driverId]);
    this.logger.log(
      `Re-dispatch après expiration (accept tardif) pour commande ${delivery.orderId}: ${result.dispatched ? 'OK → ' + result.driverName : result.reason}`,
    );
  }
}

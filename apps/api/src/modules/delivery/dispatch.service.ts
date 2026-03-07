import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DeliveryStatus, OrderStatus, Role } from '@prisma/client';

export interface DispatchResult {
  dispatched: boolean;
  deliveryId?: string;
  driverId?: string;
  driverName?: string;
  reason?: string;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Finds the first available driver for dispatch.
   * Criteria: DRIVER role, isActive, isOnline, no active delivery.
   * Future: add proximity sorting by lat/lng.
   */
  async findAvailableDriver(excludeDriverIds: string[] = []): Promise<{ id: string; firstName: string; lastName: string } | null> {
    const activeDeliveryDriverIds = await this.prisma.delivery.findMany({
      where: {
        status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.ACCEPTED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT] },
      },
      select: { driverId: true },
    });
    const busyDriverIds = activeDeliveryDriverIds.map((d) => d.driverId);

    const allExcluded = [...new Set([...busyDriverIds, ...excludeDriverIds])];

    const driver = await this.prisma.user.findFirst({
      where: {
        role: Role.DRIVER,
        isActive: true,
        isOnline: true,
        id: { notIn: allExcluded.length > 0 ? allExcluded : undefined },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'asc' },
    });

    return driver;
  }

  /**
   * Auto-dispatch a READY_FOR_PICKUP order to an available driver.
   * Called when order status transitions to READY_FOR_PICKUP.
   * Non-blocking: if no driver is available, the order stays in READY_FOR_PICKUP.
   */
  async dispatchOrder(orderId: string): Promise<DispatchResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      return { dispatched: false, reason: 'Commande non trouvée' };
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return { dispatched: false, reason: `Commande au statut ${order.status}, READY_FOR_PICKUP attendu` };
    }

    if (order.delivery) {
      return { dispatched: false, reason: 'Un livreur est déjà assigné à cette commande' };
    }

    const driver = await this.findAvailableDriver();

    if (!driver) {
      this.logger.warn(`Aucun driver disponible pour la commande ${orderId}`);
      return { dispatched: false, reason: 'Aucun livreur disponible pour le moment' };
    }

    try {
      const delivery = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.delivery.findUnique({ where: { orderId } });
        if (existing) {
          throw new Error('ALREADY_ASSIGNED');
        }

        return tx.delivery.create({
          data: {
            orderId,
            driverId: driver.id,
            status: DeliveryStatus.ASSIGNED,
            deliveryFee: order.deliveryFee,
            assignedAt: new Date(),
          },
        });
      });

      this.logger.log(`Commande ${orderId} assignée au driver ${driver.firstName} ${driver.lastName} (${driver.id})`);

      return {
        dispatched: true,
        deliveryId: delivery.id,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
      };
    } catch (error: any) {
      if (error?.message === 'ALREADY_ASSIGNED' || error?.code === 'P2002') {
        return { dispatched: false, reason: 'Commande déjà assignée (concurrence)' };
      }
      throw error;
    }
  }
}

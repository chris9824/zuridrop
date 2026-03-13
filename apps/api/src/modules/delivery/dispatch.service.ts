import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { DeliveryStatus, DriverAvailability, OrderStatus, Role } from '@prisma/client';
import { haversineDistanceKm } from '../../common/utils/geo-distance';

const ASSIGNMENT_TIMEOUT_MS = 120_000; // 2 minutes
const MAX_DISPATCH_RADIUS_KM = 10;

const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.ACCEPTED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

interface DriverCandidate {
  id: string;
  firstName: string;
  lastName: string;
  distanceKm: number;
}

export interface DispatchResult {
  dispatched: boolean;
  deliveryId?: string;
  driverId?: string;
  driverName?: string;
  reason?: string;
  selectedDriverDistanceKm?: number;
  candidateCount?: number;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Finds the nearest AVAILABLE driver relative to a restaurant.
   *
   * 1. Load all AVAILABLE drivers (excluding busy + explicitly excluded)
   * 2. Filter out drivers without GPS coordinates
   * 3. Compute Haversine distance to restaurant
   * 4. Filter by MAX_DISPATCH_RADIUS_KM
   * 5. Return the closest one
   *
   * Falls back to oldest-first if restaurant has no coordinates.
   */
  async findNearestAvailableDriver(
    restaurantLat: number | null,
    restaurantLon: number | null,
    excludeDriverIds: string[] = [],
  ): Promise<DriverCandidate | null> {
    const busyDriverIds = await this.prisma.delivery
      .findMany({
        where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
        select: { driverId: true },
      })
      .then((rows) => rows.map((d) => d.driverId));

    const allExcluded = [...new Set([...busyDriverIds, ...excludeDriverIds])];

    const drivers = await this.prisma.user.findMany({
      where: {
        role: Role.DRIVER,
        isActive: true,
        availability: DriverAvailability.AVAILABLE,
        ...(allExcluded.length > 0 ? { id: { notIn: allExcluded } } : {}),
      },
      select: { id: true, firstName: true, lastName: true, latitude: true, longitude: true },
    });

    if (drivers.length === 0) return null;

    // Fallback: no restaurant GPS → pick first by name (deterministic)
    if (restaurantLat == null || restaurantLon == null) {
      this.logger.warn('Restaurant sans coordonnées GPS — fallback premier driver disponible');
      const fallback = drivers[0];
      return { id: fallback.id, firstName: fallback.firstName, lastName: fallback.lastName, distanceKm: -1 };
    }

    const candidates: DriverCandidate[] = [];

    for (const d of drivers) {
      if (d.latitude == null || d.longitude == null) {
        this.logger.debug(`Driver ${d.firstName} ${d.lastName} ignoré (pas de coordonnées GPS)`);
        continue;
      }

      const distanceKm = haversineDistanceKm(restaurantLat, restaurantLon, d.latitude, d.longitude);

      if (distanceKm > MAX_DISPATCH_RADIUS_KM) {
        this.logger.debug(
          `Driver ${d.firstName} ${d.lastName} hors rayon (${distanceKm.toFixed(1)} km > ${MAX_DISPATCH_RADIUS_KM} km)`,
        );
        continue;
      }

      candidates.push({ id: d.id, firstName: d.firstName, lastName: d.lastName, distanceKm });
    }

    if (candidates.length === 0) {
      this.logger.warn(
        `${drivers.length} driver(s) disponible(s) mais aucun dans le rayon de ${MAX_DISPATCH_RADIUS_KM} km`,
      );
      return null;
    }

    candidates.sort((a, b) => a.distanceKm - b.distanceKm);

    const selected = candidates[0];
    this.logger.log(
      `${candidates.length} candidat(s) dans le rayon — sélectionné: ${selected.firstName} ${selected.lastName} à ${selected.distanceKm.toFixed(2)} km`,
    );

    return selected;
  }

  /**
   * Auto-dispatch a READY_FOR_PICKUP order to the nearest available driver.
   * Non-blocking: if no driver is available, the order stays in READY_FOR_PICKUP.
   */
  async dispatchOrder(
    orderId: string,
    excludeDriverIds: string[] = [],
  ): Promise<DispatchResult> {
    this.logger.log(`Dispatch démarré pour commande ${orderId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
        restaurant: { select: { id: true, name: true, latitude: true, longitude: true } },
      },
    });

    if (!order) {
      return { dispatched: false, reason: 'Commande non trouvée' };
    }

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      return {
        dispatched: false,
        reason: `Commande au statut ${order.status}, READY_FOR_PICKUP attendu`,
      };
    }

    if (order.delivery && ACTIVE_DELIVERY_STATUSES.includes(order.delivery.status)) {
      return {
        dispatched: false,
        reason: 'Un livreur est déjà assigné à cette commande',
      };
    }

    const restaurantLat = order.restaurant.latitude;
    const restaurantLon = order.restaurant.longitude;

    if (restaurantLat == null || restaurantLon == null) {
      this.logger.warn(
        `Restaurant "${order.restaurant.name}" (${order.restaurant.id}) sans coordonnées GPS`,
      );
    }

    const driver = await this.findNearestAvailableDriver(
      restaurantLat,
      restaurantLon,
      excludeDriverIds,
    );

    if (!driver) {
      this.logger.warn(`Aucun driver disponible pour la commande ${orderId}`);
      return {
        dispatched: false,
        reason: 'Aucun livreur disponible pour le moment',
        candidateCount: 0,
      };
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ASSIGNMENT_TIMEOUT_MS);

      const delivery = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.delivery.findUnique({ where: { orderId } });
        if (existing && ACTIVE_DELIVERY_STATUSES.includes(existing.status)) {
          throw new Error('ALREADY_ASSIGNED');
        }
        if (existing) {
          await tx.delivery.delete({ where: { id: existing.id } });
        }

        await tx.user.update({
          where: { id: driver.id },
          data: { availability: DriverAvailability.BUSY, isOnline: true },
        });

        return tx.delivery.create({
          data: {
            orderId,
            driverId: driver.id,
            status: DeliveryStatus.ASSIGNED,
            deliveryFee: order.deliveryFee,
            assignedAt: now,
            assignmentExpiresAt: expiresAt,
          },
        });
      });

      const distanceLabel = driver.distanceKm >= 0
        ? `${driver.distanceKm.toFixed(2)} km`
        : 'distance inconnue';

      this.logger.log(
        `Commande ${orderId} → driver ${driver.firstName} ${driver.lastName} (${distanceLabel}), expire ${expiresAt.toISOString()}`,
      );

      return {
        dispatched: true,
        deliveryId: delivery.id,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        selectedDriverDistanceKm: driver.distanceKm >= 0 ? +driver.distanceKm.toFixed(2) : undefined,
      };
    } catch (error: any) {
      if (error?.message === 'ALREADY_ASSIGNED' || error?.code === 'P2002') {
        return { dispatched: false, reason: 'Commande déjà assignée (concurrence)' };
      }
      throw error;
    }
  }

  /**
   * Expire stale ASSIGNED deliveries and re-dispatch to nearest driver.
   */
  async expireStaleAssignments(): Promise<number> {
    const now = new Date();

    const staleDeliveries = await this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.ASSIGNED,
        assignmentExpiresAt: { lte: now },
      },
      include: { driver: { select: { id: true, firstName: true, lastName: true } } },
    });

    let expiredCount = 0;

    for (const delivery of staleDeliveries) {
      this.logger.warn(
        `Delivery ${delivery.id} expirée (driver ${delivery.driver.firstName} ${delivery.driver.lastName} n'a pas répondu pour commande ${delivery.orderId})`,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.delivery.delete({ where: { id: delivery.id } });
        await tx.user.update({
          where: { id: delivery.driverId },
          data: { availability: DriverAvailability.AVAILABLE },
        });
      });

      expiredCount++;

      const result = await this.dispatchOrder(delivery.orderId, [delivery.driverId]);
      this.logger.log(
        `Re-dispatch après expiration pour commande ${delivery.orderId}: ${result.dispatched ? 'OK → ' + result.driverName + ' (' + (result.selectedDriverDistanceKm ?? '?') + ' km)' : result.reason}`,
      );
    }

    return expiredCount;
  }
}

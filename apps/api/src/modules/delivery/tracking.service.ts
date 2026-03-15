import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { haversineDistanceKm } from '../../common/utils/geo-distance';

const STEP_INTERVAL_MS = 4_000;
const TOTAL_STEPS = 30;

interface SimulationState {
  orderId: string;
  deliveryId: string;
  restaurantLat: number;
  restaurantLng: number;
  customerLat: number;
  customerLng: number;
  currentLat: number;
  currentLng: number;
  totalSteps: number;
  currentStep: number;
  startedAt: Date;
  intervalRef: NodeJS.Timeout;
}

export interface TrackingData {
  orderId: string;
  status: 'WAITING' | 'EN_ROUTE' | 'APPROACHING' | 'ARRIVED';
  restaurant: { lat: number; lng: number } | null;
  customer: { lat: number; lng: number } | null;
  driver: { lat: number; lng: number } | null;
  distanceRemainingKm: number | null;
  percentProgress: number;
  updatedAt: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private simulations = new Map<string, SimulationState>();

  constructor(private prisma: PrismaService) {}

  async startSimulation(orderId: string, deliveryId: string): Promise<void> {
    if (this.simulations.has(orderId)) {
      this.logger.warn(`Simulation already running for order ${orderId}`);
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { latitude: true, longitude: true } },
        deliveryAddress: { select: { latitude: true, longitude: true } },
      },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId} not found for tracking simulation`);
      return;
    }

    const rLat = order.restaurant.latitude;
    const rLng = order.restaurant.longitude;
    const cLat = order.deliveryAddress?.latitude;
    const cLng = order.deliveryAddress?.longitude;

    if (rLat == null || rLng == null || cLat == null || cLng == null) {
      this.logger.warn(
        `Missing coordinates for order ${orderId} — restaurant: (${rLat},${rLng}), customer: (${cLat},${cLng}). Simulation skipped.`,
      );
      return;
    }

    const state: SimulationState = {
      orderId,
      deliveryId,
      restaurantLat: rLat,
      restaurantLng: rLng,
      customerLat: cLat,
      customerLng: cLng,
      currentLat: rLat,
      currentLng: rLng,
      totalSteps: TOTAL_STEPS,
      currentStep: 0,
      startedAt: new Date(),
      intervalRef: null!,
    };

    state.intervalRef = setInterval(() => this.advanceStep(orderId), STEP_INTERVAL_MS);
    this.simulations.set(orderId, state);

    this.logger.log(
      `Tracking simulation started for order ${orderId}: (${rLat},${rLng}) → (${cLat},${cLng}), ${TOTAL_STEPS} steps every ${STEP_INTERVAL_MS}ms`,
    );
  }

  stopSimulation(orderId: string): void {
    const sim = this.simulations.get(orderId);
    if (!sim) return;

    clearInterval(sim.intervalRef);
    sim.currentLat = sim.customerLat;
    sim.currentLng = sim.customerLng;
    sim.currentStep = sim.totalSteps;
    this.simulations.set(orderId, sim);

    setTimeout(() => this.simulations.delete(orderId), 60_000);

    this.logger.log(`Tracking simulation stopped for order ${orderId}`);
  }

  getTracking(orderId: string): TrackingData {
    const sim = this.simulations.get(orderId);

    if (!sim) {
      return {
        orderId,
        status: 'WAITING',
        restaurant: null,
        customer: null,
        driver: null,
        distanceRemainingKm: null,
        percentProgress: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    const progress = sim.totalSteps > 0
      ? Math.min(100, Math.round((sim.currentStep / sim.totalSteps) * 100))
      : 0;

    const distanceRemaining = haversineDistanceKm(
      sim.currentLat, sim.currentLng,
      sim.customerLat, sim.customerLng,
    );

    let status: TrackingData['status'] = 'EN_ROUTE';
    if (progress >= 100) status = 'ARRIVED';
    else if (progress >= 80) status = 'APPROACHING';
    else if (progress === 0) status = 'WAITING';

    return {
      orderId,
      status,
      restaurant: { lat: sim.restaurantLat, lng: sim.restaurantLng },
      customer: { lat: sim.customerLat, lng: sim.customerLng },
      driver: { lat: sim.currentLat, lng: sim.currentLng },
      distanceRemainingKm: +distanceRemaining.toFixed(2),
      percentProgress: progress,
      updatedAt: new Date().toISOString(),
    };
  }

  private advanceStep(orderId: string): void {
    const sim = this.simulations.get(orderId);
    if (!sim) return;

    if (sim.currentStep >= sim.totalSteps) {
      clearInterval(sim.intervalRef);
      return;
    }

    sim.currentStep++;
    const t = sim.currentStep / sim.totalSteps;

    const wobble = Math.sin(t * Math.PI * 4) * 0.0003 * (1 - t);

    sim.currentLat = sim.restaurantLat + (sim.customerLat - sim.restaurantLat) * t + wobble;
    sim.currentLng = sim.restaurantLng + (sim.customerLng - sim.restaurantLng) * t - wobble * 0.7;

    this.simulations.set(orderId, sim);
  }
}

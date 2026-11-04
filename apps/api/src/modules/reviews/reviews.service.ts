import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateReviewDto } from './dto';
import { OrderStatus, ReviewType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(customerId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        delivery: { select: { driverId: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Seules les commandes livrées peuvent être notées');
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        orderId_type: { orderId: dto.orderId, type: dto.type },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Vous avez déjà laissé un avis ${dto.type === ReviewType.RESTAURANT ? 'pour ce restaurant' : 'pour ce livreur'} sur cette commande`,
      );
    }

    if (dto.type === ReviewType.RESTAURANT && !order.restaurantId) {
      throw new BadRequestException('Cette commande n\'a pas de restaurant associé');
    }

    if (dto.type === ReviewType.DRIVER) {
      const driverId = order.delivery?.driverId;
      if (!driverId) {
        throw new BadRequestException('Cette commande n\'a pas de livreur assigné');
      }
    }

    const restaurantId = dto.type === ReviewType.RESTAURANT ? order.restaurantId : null;
    const driverId = dto.type === ReviewType.DRIVER ? order.delivery?.driverId ?? null : null;

    return this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        customerId,
        restaurantId,
        driverId,
        type: dto.type,
        rating: dto.rating,
        comment: dto.comment?.trim() || undefined,
      },
      include: {
        restaurant: { select: { id: true, name: true } },
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getByOrder(orderId: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Cette commande ne vous appartient pas');
    }

    return this.prisma.review.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurantReviews(restaurantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { restaurantId, type: ReviewType.RESTAURANT },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({
        where: { restaurantId, type: ReviewType.RESTAURANT },
      }),
      this.prisma.review.aggregate({
        where: { restaurantId, type: ReviewType.RESTAURANT },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    };
  }

  async getRestaurantSummary(restaurantId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { restaurantId, type: ReviewType.RESTAURANT },
      _avg: { rating: true },
      _count: true,
    });

    return {
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    };
  }

  async getDriverReviews(driverId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { driverId, type: ReviewType.DRIVER },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({
        where: { driverId, type: ReviewType.DRIVER },
      }),
      this.prisma.review.aggregate({
        where: { driverId, type: ReviewType.DRIVER },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    };
  }

  async getDriverSummary(driverId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { driverId, type: ReviewType.DRIVER },
      _avg: { rating: true },
      _count: true,
    });

    return {
      averageRating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    };
  }
}

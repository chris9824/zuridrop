import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreatePromotionDto } from './dto';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  /** Active promotions visible to everyone */
  async findActive() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** All promotions (admin) */
  async findAll() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create promotion (admin) */
  async create(dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discount: dto.discount,
        isPercent: dto.isPercent ?? true,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
      },
    });
  }
}

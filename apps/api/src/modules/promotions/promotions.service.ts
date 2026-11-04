import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreatePromotionDto, ValidatePromoDto } from './dto';
import { PromotionType } from '@prisma/client';

export interface ValidatePromoResult {
  valid: boolean;
  message?: string;
  promotionId?: string;
  promoCode?: string;
  type?: PromotionType;
  discountAmount: number;
  freeDelivery: boolean;
  finalTotal: number;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  /** Valide un code promo et calcule la réduction */
  async validate(dto: ValidatePromoDto): Promise<ValidatePromoResult> {
    const code = dto.code.trim().toUpperCase();
    if (!code) {
      return this.invalid('Code promo requis');
    }

    const promo = await this.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promo) {
      return this.invalid('Code promo invalide');
    }

    if (!promo.isActive) {
      return this.invalid('Ce code promo n\'est plus actif');
    }

    const now = new Date();
    if (now < promo.startsAt) {
      return this.invalid('Ce code promo n\'est pas encore actif');
    }
    if (now > promo.expiresAt) {
      return this.invalid('Ce code promo a expiré');
    }

    if (promo.minOrderAmount != null && dto.subtotal < promo.minOrderAmount) {
      return this.invalid(
        `Commande minimum de ${promo.minOrderAmount.toLocaleString('fr-FR')} FCFA requise`,
      );
    }

    if (promo.maxUses != null && promo.usageCount >= promo.maxUses) {
      return this.invalid('Ce code promo a atteint sa limite d\'utilisation');
    }

    if (dto.customerId && promo.maxUsesPerUser != null) {
      const userUsageCount = await this.prisma.order.count({
        where: {
          customerId: dto.customerId,
          promotionId: promo.id,
        },
      });
      if (userUsageCount >= promo.maxUsesPerUser) {
        return this.invalid('Vous avez déjà utilisé ce code le nombre maximum de fois');
      }
    }

    const totalBeforeDiscount = dto.subtotal + dto.deliveryFee;
    let discountAmount = 0;
    let freeDelivery = false;

    switch (promo.type) {
      case PromotionType.FIXED_AMOUNT:
        discountAmount = Math.min(promo.value, totalBeforeDiscount);
        break;
      case PromotionType.PERCENT:
        discountAmount = Math.round((dto.subtotal * promo.value) / 100);
        discountAmount = Math.min(discountAmount, totalBeforeDiscount);
        break;
      case PromotionType.FREE_DELIVERY:
        freeDelivery = true;
        discountAmount = dto.deliveryFee;
        break;
      default:
        return this.invalid('Type de promotion non supporté');
    }

    if (discountAmount <= 0) {
      return this.invalid('Aucune réduction applicable');
    }

    const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);

    return {
      valid: true,
      promotionId: promo.id,
      promoCode: promo.code,
      type: promo.type,
      discountAmount,
      freeDelivery,
      finalTotal,
    };
  }

  private invalid(message: string): ValidatePromoResult {
    return {
      valid: false,
      message,
      discountAmount: 0,
      freeDelivery: false,
      finalTotal: 0,
    };
  }

  /** Incrémente le compteur d'utilisation d'une promo (appelé après création de commande) */
  async incrementUsage(promotionId: string): Promise<void> {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { usageCount: { increment: 1 } },
    });
  }

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
    if (dto.type === PromotionType.PERCENT && (dto.value < 0 || dto.value > 100)) {
      throw new BadRequestException('Le pourcentage doit être entre 0 et 100');
    }
    if ((dto.type === PromotionType.FIXED_AMOUNT || dto.type === PromotionType.FREE_DELIVERY) && dto.value < 0) {
      throw new BadRequestException('La valeur doit être positive');
    }

    return this.prisma.promotion.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        description: dto.description,
        type: dto.type,
        value: dto.value,
        startsAt: new Date(dto.startsAt),
        expiresAt: new Date(dto.expiresAt),
        minOrderAmount: dto.minOrderAmount ?? undefined,
        maxUses: dto.maxUses ?? undefined,
        maxUsesPerUser: dto.maxUsesPerUser ?? undefined,
      },
    });
  }
}

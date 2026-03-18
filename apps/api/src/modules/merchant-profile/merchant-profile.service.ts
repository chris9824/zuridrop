import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';

@Injectable()
export class MerchantProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(merchantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: merchantId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const restaurant = await this.prisma.restaurant.findFirst({
      where: { merchantId },
      include: { menuItems: true },
    });

    return {
      user,
      restaurant: restaurant || null,
    };
  }

  async updateProfile(merchantId: string, dto: UpdateMerchantProfileDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { merchantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Aucun restaurant associé à votre compte. Créez d\'abord un restaurant.');
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description != null && { description: dto.description }),
        ...(dto.cuisineType != null && { cuisineType: dto.cuisineType }),
        ...(dto.phone != null && { phone: dto.phone }),
        ...(dto.street != null && { street: dto.street }),
        ...(dto.city != null && { city: dto.city }),
        ...(dto.imageUrl != null && { imageUrl: dto.imageUrl }),
        ...(dto.preparationTimeMinutes != null && { preparationTimeMinutes: dto.preparationTimeMinutes }),
        ...(dto.openingTime != null && { openingTime: dto.openingTime }),
        ...(dto.closingTime != null && { closingTime: dto.closingTime }),
        ...(dto.isOpen != null && { isOpen: dto.isOpen }),
      },
      include: { menuItems: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: merchantId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    return { user, restaurant: updated };
  }
}

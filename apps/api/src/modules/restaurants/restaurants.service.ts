import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateRestaurantDto, UpdateRestaurantDto, CreateMenuItemDto, UpdateMenuItemDto, SearchRestaurantsDto } from './dto';
import { isRestaurantOpenNow } from '../../common/utils/restaurant-hours';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: SearchRestaurantsDto) {
    const { page = 1, limit = 20, sort = 'desc', q, city, isOpenNow } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Text search on restaurant name
    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    // City filter
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // If isOpenNow requested, only include restaurants with isOpen=true
    // (time-based filtering done post-query since it requires openingTime/closingTime logic)
    if (isOpenNow) {
      where.isOpen = true;
    }

    const [allData, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: isOpenNow ? limit * 2 : limit, // over-fetch if we need to filter by hours
        orderBy: { createdAt: sort },
        include: {
          menuItems: { where: { isAvailable: true } },
          merchant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    // Post-filter by opening hours if requested
    let data = allData;
    if (isOpenNow) {
      data = allData.filter((r) => isRestaurantOpenNow(r));
      // Trim to requested limit
      data = data.slice(0, limit);
    }

    return { data, total: isOpenNow ? data.length : total, page, limit, totalPages: Math.ceil((isOpenNow ? data.length : total) / limit) };
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: true,
        merchant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant non trouvé');
    return restaurant;
  }

  async createRestaurant(merchantId: string, dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: {
        merchantId,
        ...dto,
      },
      include: { menuItems: true },
    });
  }

  async updateRestaurant(merchantId: string, restaurantId: string, dto: UpdateRestaurantDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, merchantId },
    });
    if (!restaurant) {
      throw new ForbiddenException("Ce restaurant ne vous appartient pas ou n'existe pas");
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
      include: { menuItems: true },
    });
  }

  async getMerchantRestaurants(merchantId: string) {
    return this.prisma.restaurant.findMany({
      where: { merchantId },
      include: { menuItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMenuItem(merchantId: string, dto: CreateMenuItemDto) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: dto.restaurantId, merchantId },
    });
    if (!restaurant) {
      throw new ForbiddenException("Ce restaurant ne vous appartient pas ou n'existe pas");
    }

    return this.prisma.menuItem.create({
      data: {
        restaurantId: dto.restaurantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        category: dto.category,
      },
    });
  }

  async updateMenuItem(merchantId: string, menuItemId: string, dto: UpdateMenuItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem) throw new NotFoundException('Menu item non trouvé');
    if (menuItem.restaurant.merchantId !== merchantId) {
      throw new ForbiddenException("Ce menu item ne vous appartient pas");
    }

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: dto,
    });
  }

  async toggleMenuItemAvailability(merchantId: string, menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem) throw new NotFoundException('Menu item non trouvé');
    if (menuItem.restaurant.merchantId !== merchantId) {
      throw new ForbiddenException("Ce menu item ne vous appartient pas");
    }

    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { isAvailable: !menuItem.isAvailable },
    });
  }

  async toggleOpen(merchantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, merchantId },
    });

    if (!restaurant) {
      throw new ForbiddenException("Ce restaurant ne vous appartient pas ou n'existe pas");
    }

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: !restaurant.isOpen },
    });
  }
}

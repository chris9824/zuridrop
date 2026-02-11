import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { SearchMenuItemsDto } from './dto';
import { isRestaurantOpenNow } from '../../common/utils/restaurant-hours';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search menu items across all restaurants.
   * Supports: text search (q), category filter, restaurantId filter, isOpenNow filter.
   * Only returns available items (isAvailable=true).
   */
  async searchMenuItems(filter: SearchMenuItemsDto) {
    const { page = 1, limit = 20, sort = 'desc', q, category, restaurantId, isOpenNow } = filter;
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: true,
    };

    // Text search on name or description
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    // Restaurant filter
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    // If isOpenNow, only include items from open restaurants (DB-level pre-filter)
    if (isOpenNow) {
      where.restaurant = { isOpen: true };
    }

    const overFetchLimit = isOpenNow ? limit * 3 : limit;

    const [allData, totalCount] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take: overFetchLimit,
        orderBy: { createdAt: sort },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
              isOpen: true,
              openingTime: true,
              closingTime: true,
            },
          },
        },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    // Post-filter by opening hours if requested
    let data = allData;
    if (isOpenNow) {
      data = allData.filter((item) => isRestaurantOpenNow(item.restaurant));
      data = data.slice(0, limit);
    }

    const total = isOpenNow ? data.length : totalCount;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

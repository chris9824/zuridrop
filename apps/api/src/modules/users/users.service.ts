import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { GeocodingService, GeocodingException } from '../geocoding/geocoding.service';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const { password, ...result } = user;
    return result;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string; defaultAddressId?: string | null } = {};
    if (dto.firstName != null) data.firstName = dto.firstName;
    if (dto.lastName != null) data.lastName = dto.lastName;
    if (dto.phone != null) data.phone = dto.phone;
    if (dto.avatarUrl != null) data.avatarUrl = dto.avatarUrl;

    if (dto.defaultAddressId !== undefined) {
      if (dto.defaultAddressId) {
        const addr = await this.prisma.address.findFirst({
          where: { id: dto.defaultAddressId, userId },
        });
        if (!addr) throw new BadRequestException('Adresse non trouvée ou n\'appartient pas à l\'utilisateur');
        data.defaultAddressId = dto.defaultAddressId;
      } else {
        data.defaultAddressId = null;
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password, ...result } = user;
    return result;
  }

  async getMyAddresses(userId: string) {
    const [addresses, user] = await Promise.all([
      this.prisma.address.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultAddressId: true },
      }),
    ]);
    return { data: addresses, defaultAddressId: user?.defaultAddressId ?? null };
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const coords = await this.resolveCoordsForCreate({
      street: dto.street,
      city: dto.city,
      zipCode: dto.zipCode ?? null,
      country: dto.country ?? null,
    });

    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label ?? 'Home',
        street: dto.street,
        city: dto.city,
        zipCode: dto.zipCode ?? null,
        country: dto.country ?? 'Côte d\'Ivoire',
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Adresse non trouvée');

    const street = dto.street ?? address.street;
    const city = dto.city ?? address.city;
    const zipCode = dto.zipCode !== undefined ? dto.zipCode : address.zipCode;
    const country = dto.country ?? address.country;

    const addressTextChanged =
      street !== address.street ||
      city !== address.city ||
      (zipCode ?? '') !== (address.zipCode ?? '') ||
      country !== address.country;

    let latitude: number | null = address.latitude;
    let longitude: number | null = address.longitude;

    if (addressTextChanged) {
      const coords = await this.resolveCoordsForUpdate({
        street,
        city,
        zipCode: zipCode ?? null,
        country: country ?? null,
      });
      latitude = coords.latitude;
      longitude = coords.longitude;
    }

    const data: Record<string, unknown> = {
      label: dto.label ?? address.label,
      street,
      city,
      zipCode: zipCode ?? null,
      country,
      latitude,
      longitude,
    };

    return this.prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  /**
   * Résout les coordonnées pour une création d'adresse.
   * GEOCODING_ENABLED=true : géocodage strict, erreur si échec.
   * GEOCODING_ENABLED=false : fallback (mode test), pas de blocage.
   */
  private async resolveCoordsForCreate(address: {
    street: string;
    city: string;
    zipCode?: string | null;
    country?: string | null;
  }): Promise<{ latitude: number; longitude: number }> {
    if (!this.isGeocodingEnabled()) {
      return this.geocoding.getFallbackCoords();
    }
    return this.geocoding.geocode(address);
  }

  /**
   * Résout les coordonnées pour une modification d'adresse (texte modifié).
   * GEOCODING_ENABLED=true : géocodage strict, erreur si échec.
   * GEOCODING_ENABLED=false : tente le géocodage, fallback en cas d'échec (pas de blocage).
   */
  private async resolveCoordsForUpdate(address: {
    street: string;
    city: string;
    zipCode?: string | null;
    country?: string | null;
  }): Promise<{ latitude: number; longitude: number }> {
    if (!this.isGeocodingEnabled()) {
      try {
        return await this.geocoding.geocode(address);
      } catch {
        return this.geocoding.getFallbackCoords();
      }
    }
    return this.geocoding.geocode(address);
  }

  private isGeocodingEnabled(): boolean {
    const v = process.env.GEOCODING_ENABLED;
    return v === 'true' || v === '1';
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Adresse non trouvée');
    await this.prisma.$transaction([
      this.prisma.user.updateMany({
        where: { id: userId, defaultAddressId: addressId },
        data: { defaultAddressId: null },
      }),
      this.prisma.address.delete({ where: { id: addressId } }),
    ]);
    return { message: 'Adresse supprimée' };
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 20, sort = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async toggleActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    const { password, ...result } = updated;
    return result;
  }
}

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/services/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { Role } from '@prisma/client';
import { jwtConfig } from '../../common/config/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role || Role.CUSTOMER,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new BadRequestException('Refresh token invalide ou expiré');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    return {
      user: this.sanitizeUser(storedToken.user),
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revoked: true },
      });
    } else {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }

    return { message: 'Déconnexion réussie' };
  }

  // ─── Private Helpers ────────────────────────────────

  private async generateTokens(userId: string, email: string, role: Role) {
    const accessTtl = jwtConfig.accessTokenTtl();
    const refreshTtl = jwtConfig.refreshTokenTtl();

    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTtl,
    });

    const accessTokenExpiresAt = jwtConfig.expiresAtFromTtl(accessTtl);

    // Refresh token: UUID stored in DB
    const refreshTokenValue = uuidv4();
    const refreshTokenExpiresAt = jwtConfig.expiresAtFromTtl(refreshTtl);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    // Build response
    const response: Record<string, any> = {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
    };

    // Always include refreshToken in dev for Swagger testing ease
    // In production, only return it if explicitly needed (client stores it)
    if (jwtConfig.exposeRefreshToken()) {
      response.refreshToken = refreshTokenValue;
      response.refreshTokenExpiresAt = refreshTokenExpiresAt.toISOString();
      response._devNote = `Access token valide ${accessTtl} – copiez-le dans Authorize`;
    } else {
      response.refreshToken = refreshTokenValue;
      response.refreshTokenExpiresAt = refreshTokenExpiresAt.toISOString();
    }

    return response;
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: '10% de réduction sur votre première commande' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PromotionType, example: PromotionType.PERCENT })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ example: 10, description: 'Pourcentage (0-100) ou montant FCFA selon le type' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2025-12-31T23:59:59.000Z' })
  @IsDateString()
  expiresAt: string;

  @ApiPropertyOptional({ example: 5000, description: 'Montant minimum de commande en FCFA' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 1000, description: "Nombre max d'utilisations global" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ example: 1, description: "Nombre max d'utilisations par utilisateur" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsesPerUser?: number;
}

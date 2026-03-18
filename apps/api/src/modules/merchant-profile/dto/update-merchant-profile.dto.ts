import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMerchantProfileDto {
  @ApiPropertyOptional({ example: 'Chez Moussa' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Le meilleur maquis d\'Abidjan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Ivoirienne' })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @ApiPropertyOptional({ example: '+225 05 05 05 05' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '45 Rue des Jardins' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  preparationTimeMinutes?: number;

  @ApiPropertyOptional({ example: '08:00', description: 'Heure d\'ouverture (HH:mm)' })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({ example: '23:00', description: 'Heure de fermeture (HH:mm)' })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiPropertyOptional({ example: true, description: 'Restaurant ouvert manuellement' })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}

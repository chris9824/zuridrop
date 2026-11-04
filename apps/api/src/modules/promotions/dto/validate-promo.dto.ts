import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: "ID du client (pour limite d'utilisation par user)" })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: "ID du restaurant (pour restrictions futures)" })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiProperty({ example: 15000, description: 'Sous-total en FCFA' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 500, description: 'Frais de livraison en FCFA' })
  @IsNumber()
  @Min(0)
  deliveryFee: number;
}

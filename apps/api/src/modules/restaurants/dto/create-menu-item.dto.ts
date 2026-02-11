import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Attiéké Poisson' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Attiéké avec poisson braisé et alloco' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Plats principaux' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'restaurant-cuid-here' })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;
}

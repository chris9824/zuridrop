import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: '123 Rue de la Paix' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Abidjan' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: '00225' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ example: "Côte d'Ivoire" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 5.3364 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -4.0267 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

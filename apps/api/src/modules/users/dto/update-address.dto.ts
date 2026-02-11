import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Bureau' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: '456 Avenue Houphouët-Boigny' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  city?: string;

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

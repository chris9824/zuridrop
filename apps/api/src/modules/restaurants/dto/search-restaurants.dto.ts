import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchRestaurantsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Recherche par nom de restaurant (insensible à la casse)',
    example: 'Chez',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ville',
    example: 'Abidjan',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filtrer uniquement les restaurants ouverts maintenant',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOpenNow?: boolean;
}

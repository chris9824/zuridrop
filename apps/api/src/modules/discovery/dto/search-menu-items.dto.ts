import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class SearchMenuItemsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Recherche par nom ou description du plat (insensible à la casse)',
    example: 'poulet',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par catégorie du plat',
    example: 'Entrée',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par restaurant spécifique',
  })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiPropertyOptional({
    description: 'Afficher uniquement les plats de restaurants ouverts',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOpenNow?: boolean;
}

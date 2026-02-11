import { IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class MerchantOrderFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrer par statut(s). Par défaut: PENDING pour incoming, ACCEPTED+PREPARING pour active.',
    enum: OrderStatus,
    isArray: true,
    example: [OrderStatus.PENDING],
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  statuses?: OrderStatus[];
}

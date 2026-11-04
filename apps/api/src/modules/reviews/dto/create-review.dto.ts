import { IsString, IsNotEmpty, IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '@prisma/client';

export class CreateReviewDto {
  @ApiProperty({ example: 'order-cuid' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: ReviewType, example: ReviewType.RESTAURANT })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellente livraison !' })
  @IsOptional()
  @IsString()
  comment?: string;
}

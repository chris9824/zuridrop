import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectDeliveryDto {
  @ApiPropertyOptional({
    example: 'Trop loin',
    description: 'Raison du refus (optionnelle)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

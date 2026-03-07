import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelDeliveryDto {
  @ApiPropertyOptional({ example: 'Le client ne répond pas', description: 'Raison de l\'annulation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

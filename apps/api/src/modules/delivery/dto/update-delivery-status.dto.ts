import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    enum: DeliveryStatus,
    enumName: 'DeliveryStatus',
    description: 'Statut de la livraison (ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED)',
    example: DeliveryStatus.PICKED_UP,
  })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}

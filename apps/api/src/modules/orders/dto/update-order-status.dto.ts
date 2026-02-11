import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    enumName: 'OrderStatus',
    description: 'Statut de la commande',
    example: OrderStatus.ACCEPTED,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

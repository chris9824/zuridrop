import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DriverAvailabilityInput {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    enum: DriverAvailabilityInput,
    enumName: 'DriverAvailabilityInput',
    description:
      'Disponibilité souhaitée.\n\n' +
      '- `AVAILABLE` : le driver est prêt à recevoir des livraisons\n' +
      '- `OFFLINE` : le driver est hors service\n\n' +
      '`BUSY` est géré automatiquement par le système.',
    example: DriverAvailabilityInput.AVAILABLE,
  })
  @IsEnum(DriverAvailabilityInput)
  availability: DriverAvailabilityInput;
}

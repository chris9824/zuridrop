import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: 5.3364 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -4.0267 })
  @IsNumber()
  longitude: number;
}

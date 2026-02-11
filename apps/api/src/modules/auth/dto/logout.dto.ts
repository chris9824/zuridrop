import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({ example: 'your-refresh-token-here', description: 'Si non fourni, tous les refresh tokens seront révoqués' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

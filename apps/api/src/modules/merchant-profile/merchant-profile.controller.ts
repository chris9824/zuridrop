import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MerchantProfileService } from './merchant-profile.service';
import { UpdateMerchantProfileDto } from './dto/update-merchant-profile.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Merchant Profile')
@Controller('merchant/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
@ApiBearerAuth()
export class MerchantProfileController {
  constructor(private readonly merchantProfileService: MerchantProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Mon profil merchant' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.merchantProfileService.getProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Mettre à jour mon profil merchant' })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateMerchantProfileDto) {
    return this.merchantProfileService.updateProfile(user.id, dto);
  }
}

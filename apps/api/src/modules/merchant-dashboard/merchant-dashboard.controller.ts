import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MerchantDashboardService } from './merchant-dashboard.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Merchant Dashboard')
@Controller('merchant/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
@ApiBearerAuth()
export class MerchantDashboardController {
  constructor(private readonly dashboardService: MerchantDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du tableau de bord' })
  getStats(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getStats(user.id);
  }
}

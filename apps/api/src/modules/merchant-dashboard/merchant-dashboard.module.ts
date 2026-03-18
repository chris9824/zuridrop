import { Module } from '@nestjs/common';
import { MerchantDashboardController } from './merchant-dashboard.controller';
import { MerchantDashboardService } from './merchant-dashboard.service';
import { PrismaService } from '../../common/services/prisma.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [MerchantDashboardController],
  providers: [MerchantDashboardService, PrismaService],
  exports: [MerchantDashboardService],
})
export class MerchantDashboardModule {}

import { Module } from '@nestjs/common';
import { MerchantOrdersController } from './merchant-orders.controller';
import { MerchantOrdersService } from './merchant-orders.service';
import { OrdersModule } from '../orders/orders.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [OrdersModule],
  controllers: [MerchantOrdersController],
  providers: [MerchantOrdersService, PrismaService],
})
export class MerchantOrdersModule {}

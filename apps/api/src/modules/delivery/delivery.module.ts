import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DriverController } from './driver.controller';
import { DeliveryService } from './delivery.service';
import { DispatchService } from './dispatch.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [DeliveryController, DriverController],
  providers: [DeliveryService, DispatchService, PrismaService],
  exports: [DeliveryService, DispatchService],
})
export class DeliveryModule {}

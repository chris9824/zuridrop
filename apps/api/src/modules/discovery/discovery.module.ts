import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, PrismaService],
})
export class DiscoveryModule {}

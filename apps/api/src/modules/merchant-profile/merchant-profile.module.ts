import { Module } from '@nestjs/common';
import { MerchantProfileController } from './merchant-profile.controller';
import { MerchantProfileService } from './merchant-profile.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [MerchantProfileController],
  providers: [MerchantProfileService, PrismaService],
  exports: [MerchantProfileService],
})
export class MerchantProfileModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MerchantOrdersModule } from './modules/merchant-orders/merchant-orders.module';
import { MerchantProfileModule } from './modules/merchant-profile/merchant-profile.module';
import { MerchantDashboardModule } from './modules/merchant-dashboard/merchant-dashboard.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { HealthModule } from './modules/health/health.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';

@Module({
  imports: [
    GeocodingModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    DiscoveryModule,
    OrdersModule,
    MerchantOrdersModule,
    MerchantProfileModule,
    MerchantDashboardModule,
    DeliveryModule,
    PromotionsModule,
    HealthModule,
    AdminModule,
    ReviewsModule,
  ],
})
export class AppModule {}

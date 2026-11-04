import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un avis (restaurant ou livreur)' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avis pour une commande (customer)' })
  getByOrder(@CurrentUser() user: { id: string }, @Param('orderId') orderId: string) {
    return this.reviewsService.getByOrder(orderId, user.id);
  }

  @Get('restaurants/:restaurantId')
  @ApiOperation({ summary: 'Avis d\'un restaurant (public)' })
  getRestaurantReviews(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getRestaurantReviews(
      restaurantId,
      page ?? 1,
      limit ?? 20,
    );
  }

  @Get('restaurants/:restaurantId/summary')
  @ApiOperation({ summary: 'Moyenne et nombre d\'avis d\'un restaurant' })
  getRestaurantSummary(@Param('restaurantId') restaurantId: string) {
    return this.reviewsService.getRestaurantSummary(restaurantId);
  }

  @Get('drivers/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes avis (driver)' })
  getMyDriverReviews(
    @CurrentUser() user: { id: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getDriverReviews(user.id, page ?? 1, limit ?? 20);
  }

  @Get('drivers/me/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ma moyenne (driver)' })
  getMyDriverSummary(@CurrentUser() user: { id: string }) {
    return this.reviewsService.getDriverSummary(user.id);
  }

  @Get('drivers/:driverId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avis d\'un livreur (admin)' })
  getDriverReviews(
    @Param('driverId') driverId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.getDriverReviews(driverId, page ?? 1, limit ?? 20);
  }

  @Get('drivers/:driverId/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moyenne d\'un livreur (admin)' })
  getDriverSummary(@Param('driverId') driverId: string) {
    return this.reviewsService.getDriverSummary(driverId);
  }
}

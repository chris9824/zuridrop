import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto, UpdateRestaurantDto, CreateMenuItemDto, UpdateMenuItemDto, SearchRestaurantsDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister / rechercher les restaurants',
    description:
      'Recherche par nom (`q`), ville (`city`), et filtre `isOpenNow=true` pour ne voir que les restaurants ouverts.\n\n' +
      'Pagination standard avec `page`, `limit`, `sort`.',
  })
  findAll(@Query() filter: SearchRestaurantsDto) {
    return this.restaurantsService.findAll(filter);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un restaurant (merchant)' })
  createRestaurant(@CurrentUser() user: any, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.createRestaurant(user.id, dto);
  }

  @Get('merchant/mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes restaurants (merchant)' })
  getMerchantRestaurants(@CurrentUser() user: any) {
    return this.restaurantsService.getMerchantRestaurants(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un restaurant' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un restaurant (merchant)' })
  updateRestaurant(
    @CurrentUser() user: any,
    @Param('id') restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateRestaurant(user.id, restaurantId, dto);
  }

  @Post('menu-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter un menu item' })
  createMenuItem(@CurrentUser() user: any, @Body() dto: CreateMenuItemDto) {
    return this.restaurantsService.createMenuItem(user.id, dto);
  }

  @Put('menu-items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un menu item' })
  updateMenuItem(
    @CurrentUser() user: any,
    @Param('id') menuItemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(user.id, menuItemId, dto);
  }

  @Put('menu-items/:id/toggle-availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle disponibilité d\'un menu item' })
  toggleMenuItemAvailability(@CurrentUser() user: any, @Param('id') menuItemId: string) {
    return this.restaurantsService.toggleMenuItemAvailability(user.id, menuItemId);
  }

  @Put(':id/toggle-open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ouvrir/fermer un restaurant' })
  toggleOpen(@CurrentUser() user: any, @Param('id') restaurantId: string) {
    return this.restaurantsService.toggleOpen(user.id, restaurantId);
  }
}

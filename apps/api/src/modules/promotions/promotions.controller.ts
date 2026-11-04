import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, ValidatePromoDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Valider un code promo' })
  validate(@Body() dto: ValidatePromoDto) {
    return this.promotionsService.validate(dto);
  }

  @Post('validate/auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Valider un code promo (utilisateur connecté)' })
  validateAuthenticated(@CurrentUser() user: { id: string }, @Body() dto: ValidatePromoDto) {
    return this.promotionsService.validate({
      ...dto,
      customerId: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Promotions actives' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les promotions (admin)' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une promotion (admin)' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }
}

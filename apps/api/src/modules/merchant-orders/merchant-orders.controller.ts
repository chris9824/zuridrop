import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MerchantOrdersService } from './merchant-orders.service';
import { MerchantOrderFilterDto, CancelOrderDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Merchant Orders')
@Controller('merchant/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
@ApiBearerAuth()
export class MerchantOrdersController {
  constructor(private readonly merchantOrdersService: MerchantOrdersService) {}

  // ─── Listes ──────────────────────────────────────────

  @Get('incoming')
  @ApiOperation({
    summary: 'Commandes entrantes (à traiter)',
    description:
      'Retourne les nouvelles commandes pour les restaurants du merchant connecté.\n\n' +
      '- Par défaut: statut **PENDING** (commandes non encore acceptées)\n' +
      '- Filtrable par `statuses` (ex: PENDING, ACCEPTED)\n' +
      '- Tri: `createdAt desc` par défaut\n\n' +
      '**UX:** Cet écran est la "file d\'attente" du merchant. Chaque commande doit être acceptée ou refusée.',
  })
  getIncoming(
    @CurrentUser() user: any,
    @Query() filter: MerchantOrderFilterDto,
  ) {
    return this.merchantOrdersService.getIncoming(user.id, filter);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Commandes en cours (en préparation)',
    description:
      'Retourne les commandes actives: **ACCEPTED**, **PREPARING**, **READY_FOR_PICKUP**.\n\n' +
      '**UX:** Cet écran montre la progression des commandes en cuisine.',
  })
  getActive(
    @CurrentUser() user: any,
    @Query() filter: MerchantOrderFilterDto,
  ) {
    return this.merchantOrdersService.getActive(user.id, filter);
  }

  // ─── Actions ─────────────────────────────────────────

  @Patch(':orderId/accept')
  @ApiOperation({
    summary: 'Accepter une commande',
    description:
      'Transition: **PENDING → ACCEPTED**.\n\n' +
      'Le merchant confirme qu\'il prend en charge la commande. ' +
      'Le customer est notifié que sa commande est acceptée.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande à accepter' })
  accept(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.merchantOrdersService.accept(user.id, orderId);
  }

  @Patch(':orderId/start-preparing')
  @ApiOperation({
    summary: 'Démarrer la préparation',
    description:
      'Transition: **ACCEPTED → PREPARING**.\n\n' +
      'La cuisine a commencé à préparer la commande.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  startPreparing(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.merchantOrdersService.startPreparing(user.id, orderId);
  }

  @Patch(':orderId/ready-for-pickup')
  @ApiOperation({
    summary: 'Marquer prêt pour ramassage',
    description:
      'Transition: **PREPARING → READY_FOR_PICKUP**.\n\n' +
      'La commande est prête et attend un driver. ' +
      'Visible par les drivers disponibles pour assignation.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  readyForPickup(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
  ) {
    return this.merchantOrdersService.readyForPickup(user.id, orderId);
  }

  @Patch(':orderId/cancel')
  @ApiOperation({
    summary: 'Annuler une commande',
    description:
      'Transition: **PENDING ou ACCEPTED → CANCELLED**.\n\n' +
      'Le merchant peut annuler une commande pas encore en préparation. ' +
      'Raison d\'annulation optionnelle mais recommandée (audit).\n\n' +
      '⚠️ Impossible d\'annuler une commande déjà en PREPARING ou plus avancée.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande à annuler' })
  cancel(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.merchantOrdersService.cancel(user.id, orderId, dto.reason);
  }
}

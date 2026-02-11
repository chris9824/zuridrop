import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { UpdateLocationDto, UpdateDeliveryStatusDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Delivery')
@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ─── Driver Status ──────────────────────────────────

  @Put('toggle-online')
  @ApiOperation({ summary: 'Toggle statut en ligne du driver' })
  toggleOnline(@CurrentUser() user: any) {
    return this.deliveryService.toggleOnline(user.id);
  }

  @Post('location')
  @ApiOperation({ summary: 'Mettre à jour la position du driver' })
  updateLocation(@CurrentUser() user: any, @Body() dto: UpdateLocationDto) {
    return this.deliveryService.updateLocation(user.id, dto);
  }

  // ─── Queries ────────────────────────────────────────

  @Get('active')
  @ApiOperation({
    summary: 'Récupérer la livraison active',
    description: 'Retourne la livraison en cours (ASSIGNED, PICKED_UP ou IN_TRANSIT) du driver connecté.',
  })
  getActiveDelivery(@CurrentUser() user: any) {
    return this.deliveryService.getActiveDelivery(user.id);
  }

  @Get('available-orders')
  @ApiOperation({
    summary: 'Commandes disponibles pour ramassage',
    description:
      'Liste les commandes au statut **READY_FOR_PICKUP** sans livraison assignée.\n\n' +
      'Le driver peut ensuite en choisir une et appeler `POST /delivery/{orderId}/assign`.',
  })
  getAvailableOrders() {
    return this.deliveryService.getAvailableOrders();
  }

  @Get('earnings')
  @ApiOperation({ summary: 'Voir mes revenus de livraison' })
  getEarnings(@CurrentUser() user: any) {
    return this.deliveryService.getEarnings(user.id);
  }

  // ─── Action-based Flow ──────────────────────────────

  @Post(':orderId/assign')
  @ApiOperation({
    summary: '1. S\'assigner une commande',
    description:
      'Crée une livraison et l\'assigne au driver connecté.\n\n' +
      '**Pré-requis:** la commande doit être au statut `READY_FOR_PICKUP` et sans livraison existante.\n\n' +
      '**Effet:** Delivery créée avec statut `ASSIGNED`.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande à prendre en charge' })
  assign(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.deliveryService.assignToDriver(user.id, orderId);
  }

  @Post(':orderId/pickup')
  @ApiOperation({
    summary: '2. Confirmer le ramassage',
    description:
      'Le driver confirme avoir récupéré la commande au restaurant.\n\n' +
      '**Transition:** `ASSIGNED → PICKED_UP`\n\n' +
      '**Effet:** horodatage `pickedUpAt` enregistré.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  pickup(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.deliveryService.pickupOrder(user.id, orderId);
  }

  @Post(':orderId/start')
  @ApiOperation({
    summary: '3. Démarrer la livraison',
    description:
      'Le driver est en route vers le client.\n\n' +
      '**Transition:** `PICKED_UP → IN_TRANSIT`',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  start(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.deliveryService.startDelivery(user.id, orderId);
  }

  @Post(':orderId/complete')
  @ApiOperation({
    summary: '4. Terminer la livraison',
    description:
      'Le driver confirme la livraison au client.\n\n' +
      '**Transition:** `IN_TRANSIT → DELIVERED`\n\n' +
      '**Effet:** horodatage `deliveredAt` enregistré, commande marquée `DELIVERED`.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  complete(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.deliveryService.completeDelivery(user.id, orderId);
  }

  // ─── Legacy (backward compat) ──────────────────────

  @Put(':orderId/status')
  @ApiOperation({
    summary: '[Legacy] Mettre à jour le statut manuellement',
    description:
      '⚠️ **Déprécié** – Préférez les endpoints action-based ci-dessus.\n\n' +
      'Met à jour le statut d\'une livraison existante via un champ `status` libre.',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la commande' })
  updateDeliveryStatus(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(user.id, orderId, dto);
  }
}

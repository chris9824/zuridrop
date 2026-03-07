import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { CancelDeliveryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Driver Deliveries')
@Controller('driver/deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
@ApiBearerAuth()
export class DriverController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('mine')
  @ApiOperation({
    summary: 'Mes livraisons',
    description: 'Liste toutes les livraisons du driver connecté (récentes en premier).',
  })
  getMyDeliveries(@CurrentUser() user: any) {
    return this.deliveryService.getDriverDeliveries(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d\'une livraison',
    description: 'Retourne le détail complet d\'une livraison appartenant au driver connecté.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  getDeliveryById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.getDeliveryById(user.id, id);
  }

  @Patch(':id/accept')
  @ApiOperation({
    summary: '1. Accepter la livraison',
    description:
      'Le driver confirme qu\'il prend en charge la livraison.\n\n' +
      '**Transition:** `ASSIGNED → ACCEPTED`\n\n' +
      '**Effet:** horodatage `acceptedAt` enregistré.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.acceptDelivery(user.id, id);
  }

  @Patch(':id/pickup')
  @ApiOperation({
    summary: '2. Confirmer le ramassage',
    description:
      'Le driver a récupéré la commande au restaurant.\n\n' +
      '**Transition:** `ACCEPTED → PICKED_UP`\n\n' +
      '**Effet:** horodatage `pickedUpAt`, commande passe à `PICKED_UP`.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  pickup(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.pickupDelivery(user.id, id);
  }

  @Patch(':id/start')
  @ApiOperation({
    summary: '3. Démarrer la livraison',
    description:
      'Le driver est en route vers le client.\n\n' +
      '**Transition:** `PICKED_UP → IN_TRANSIT`\n\n' +
      '**Effet:** horodatage `startedAt`, commande passe à `IN_TRANSIT`.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  start(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.startDelivery(user.id, id);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: '4. Terminer la livraison',
    description:
      'Le driver confirme la livraison au client.\n\n' +
      '**Transition:** `IN_TRANSIT → DELIVERED`\n\n' +
      '**Effet:** horodatage `deliveredAt`, commande passe à `DELIVERED`.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.completeDelivery(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Annuler la livraison',
    description:
      'Le driver annule la livraison (uniquement si statut `ASSIGNED` ou `ACCEPTED`).\n\n' +
      '**Effet:** commande revient à `READY_FOR_PICKUP`, driver redevient disponible.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    return this.deliveryService.cancelDelivery(user.id, id, dto.reason);
  }
}

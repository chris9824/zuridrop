import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { DispatchService } from './dispatch.service';
import { CancelDeliveryDto, RejectDeliveryDto, UpdateAvailabilityDto, UpdateDriverProfileDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Driver')
@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
@ApiBearerAuth()
export class DriverController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly dispatchService: DispatchService,
  ) {}

  // ─── Profile ────────────────────────────────────────

  @Get('profile')
  @ApiOperation({ summary: 'Mon profil driver' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.deliveryService.getDriverProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Mettre à jour mon profil driver' })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateDriverProfileDto) {
    return this.deliveryService.updateDriverProfile(user.id, dto);
  }

  // ─── Availability ───────────────────────────────────

  @Patch('availability')
  @ApiOperation({
    summary: 'Changer ma disponibilité',
    description:
      'Permet au driver de se mettre **AVAILABLE** (prêt) ou **OFFLINE** (hors service).\n\n' +
      '`BUSY` est géré automatiquement lors d\'une assignation.\n\n' +
      'Impossible de passer OFFLINE si une livraison active est en cours.',
  })
  @ApiResponse({ status: 200, description: 'Disponibilité mise à jour' })
  @ApiResponse({ status: 400, description: 'Livraison en cours empêche le passage OFFLINE' })
  setAvailability(
    @CurrentUser() user: any,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.deliveryService.setAvailability(user.id, dto);
  }

  // ─── Deliveries ─────────────────────────────────────

  @Get('deliveries/mine')
  @ApiOperation({
    summary: 'Mes livraisons actives',
    description:
      'Retourne les livraisons actives (ASSIGNED, ACCEPTED, PICKED_UP, IN_TRANSIT) du driver connecté.\n\n' +
      'Inclut : restaurant, client, adresse de livraison, items, statut, timestamps.',
  })
  getMyDeliveries(@CurrentUser() user: any) {
    return this.deliveryService.getDriverDeliveries(user.id);
  }

  @Get('deliveries/history')
  @ApiOperation({
    summary: 'Historique de mes livraisons',
    description:
      'Retourne les 50 dernières livraisons terminées (DELIVERED ou CANCELLED).\n\n' +
      'Utile pour la future app driver : écran historique et statistiques.',
  })
  getHistory(@CurrentUser() user: any) {
    return this.deliveryService.getDriverHistory(user.id);
  }

  @Get('deliveries/:id')
  @ApiOperation({
    summary: 'Détail d\'une livraison',
    description:
      'Retourne le détail complet d\'une livraison appartenant au driver connecté.\n\n' +
      'Inclut : commande, restaurant, client, adresse, items, timestamps.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  getDeliveryById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.getDeliveryById(user.id, id);
  }

  // ─── Lifecycle Actions ──────────────────────────────

  @Patch('deliveries/:id/accept')
  @ApiOperation({
    summary: '1. Accepter la livraison',
    description:
      'Le driver confirme qu\'il prend en charge la livraison.\n\n' +
      '**Transition:** `ASSIGNED → ACCEPTED`\n\n' +
      '**Effet:** horodatage `acceptedAt` enregistré.\n\n' +
      '**Timeout:** si le délai d\'acceptation (60s) est dépassé, la livraison est réassignée automatiquement.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  @ApiResponse({ status: 200, description: 'Livraison acceptée' })
  @ApiResponse({ status: 400, description: 'Statut invalide ou délai expiré' })
  accept(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.acceptDelivery(user.id, id);
  }

  @Patch('deliveries/:id/reject')
  @ApiOperation({
    summary: 'Refuser la livraison',
    description:
      'Le driver refuse la livraison assignée.\n\n' +
      '**Transition:** `ASSIGNED → supprimée`\n\n' +
      '**Effet:** le driver redevient AVAILABLE, le système tente immédiatement de réassigner la commande à un autre driver disponible.\n\n' +
      'Refus uniquement possible au statut ASSIGNED.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  @ApiResponse({ status: 200, description: 'Livraison refusée, re-dispatch tenté' })
  @ApiResponse({ status: 400, description: 'Refus impossible à ce statut' })
  reject(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RejectDeliveryDto,
  ) {
    return this.deliveryService.rejectDelivery(user.id, id, dto.reason);
  }

  @Patch('deliveries/:id/pickup')
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

  @Patch('deliveries/:id/start')
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

  @Patch('deliveries/:id/complete')
  @ApiOperation({
    summary: '4. Terminer la livraison',
    description:
      'Le driver confirme la livraison au client.\n\n' +
      '**Transition:** `IN_TRANSIT → DELIVERED`\n\n' +
      '**Effet:** horodatage `deliveredAt`, commande passe à `DELIVERED`, driver redevient `AVAILABLE`.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.deliveryService.completeDelivery(user.id, id);
  }

  @Patch('deliveries/:id/cancel')
  @ApiOperation({
    summary: 'Annuler la livraison',
    description:
      'Le driver annule la livraison (uniquement si statut `ASSIGNED` ou `ACCEPTED`).\n\n' +
      '**Effet:** commande revient à `READY_FOR_PICKUP`, driver redevient `AVAILABLE`, re-dispatch automatique.',
  })
  @ApiParam({ name: 'id', description: 'ID de la livraison' })
  cancel(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CancelDeliveryDto,
  ) {
    return this.deliveryService.cancelDelivery(user.id, id, dto.reason);
  }

  // ─── Admin / System ─────────────────────────────────

  @Patch('deliveries/expire-stale')
  @ApiOperation({
    summary: '[System] Expirer les assignations périmées',
    description:
      'Parcourt les deliveries au statut ASSIGNED dont le délai d\'acceptation est dépassé.\n\n' +
      'Les expire et tente un re-dispatch automatique.\n\n' +
      'Peut être appelé manuellement pour le debug ou par un cron externe.',
  })
  @ApiResponse({ status: 200, description: 'Nombre de deliveries expirées' })
  async expireStale() {
    const count = await this.dispatchService.expireStaleAssignments();
    return { expiredCount: count, message: `${count} livraison(s) expirée(s) et re-dispatchée(s)` };
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { SearchMenuItemsDto } from './dto';

@ApiTags('Discovery')
@Controller('menu-items')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Rechercher des plats',
    description:
      'Recherche de plats par nom/description (`q`), catégorie (`category`), restaurant (`restaurantId`).\n\n' +
      '`isOpenNow=true` exclut les plats de restaurants fermés.\n\n' +
      'Seuls les plats disponibles (`isAvailable=true`) sont retournés.\n\n' +
      '**UX DoorDash:** "Rechercher un plat → voir quels restaurants le proposent".',
  })
  searchMenuItems(@Query() filter: SearchMenuItemsDto) {
    return this.discoveryService.searchMenuItems(filter);
  }
}

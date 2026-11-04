import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminOrdersQueryDto, AdminListQueryDto } from './dto/admin-query.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard admin - KPIs et activité' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Liste des commandes (admin)' })
  getOrders(@Query() query: AdminOrdersQueryDto) {
    return this.adminService.getOrders(query.page, query.limit, query.status, query.q);
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Liste des restaurants (admin)' })
  getRestaurants(@Query() query: AdminListQueryDto) {
    return this.adminService.getRestaurants(query.page, query.limit, query.q);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Liste des drivers (admin)' })
  getDrivers(@Query() query: AdminListQueryDto) {
    return this.adminService.getDrivers(query.page, query.limit, query.q);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Liste des customers (admin)' })
  getCustomers(@Query() query: AdminListQueryDto) {
    return this.adminService.getCustomers(query.page, query.limit, query.q);
  }
}

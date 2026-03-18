import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get platform dashboard stats' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('verifications')
  @ApiOperation({ summary: 'List pending KYC cases' })
  listVerifications() {
    return this.adminService.listPendingVerifications();
  }

  @Patch('verifications/:id/approve')
  @ApiOperation({ summary: 'Approve a KYC case' })
  approveVerification(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.approveVerification(id, user.id, notes);
  }

  @Patch('verifications/:id/reject')
  @ApiOperation({ summary: 'Reject a KYC case' })
  rejectVerification(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.rejectVerification(id, user.id, reason);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes' })
  listDisputes() {
    return this.adminService.listAllDisputes();
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  listOrders() {
    return this.adminService.listAllOrders();
  }

  @Post('orders/:id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Put an order on risk hold (cancels it)' })
  holdOrder(@Param('id') id: string) {
    return this.adminService.holdOrder(id);
  }
}

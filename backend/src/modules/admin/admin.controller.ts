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
import { ResolveDisputeDto } from '../disputes/dto/resolve-dispute.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/admin')
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

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute (admin)' })
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.resolveDispute(id, dto, user.id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  listOrders() {
    return this.adminService.listAllOrders();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role/status' })
  updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; status?: string },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Get('orgs')
  @ApiOperation({ summary: 'List all organisations' })
  listOrgs() {
    return this.adminService.listOrgs();
  }

  @Patch('orgs/:id')
  @ApiOperation({ summary: 'Update organisation status' })
  updateOrg(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateOrgStatus(id, body.status);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List all refunds' })
  listRefunds() {
    return this.adminService.listRefunds();
  }

  @Patch('refunds/:id')
  @ApiOperation({ summary: 'Update refund status' })
  updateRefund(
    @Param('id') id: string,
    @Body() body: { status: string; providerRefundId?: string },
  ) {
    return this.adminService.updateRefund(id, body.status, body.providerRefundId);
  }

  @Post('orders/:id/hold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Put an order on risk hold (cancels it)' })
  holdOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.holdOrder(id, reason);
  }

  @Get('risk-holds')
  @ApiOperation({ summary: 'List risk/escrow holds' })
  listRiskHolds() {
    return this.adminService.listRiskHolds();
  }

  @Post('risk-holds/:orderId/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release risk/escrow hold for an order' })
  releaseRiskHold(@Param('orderId') orderId: string) {
    return this.adminService.releaseRiskHold(orderId);
  }
}

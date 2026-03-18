import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ResolveDisputeDto } from '../disputes/dto/resolve-dispute.dto';
import type { Response } from 'express';

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
  listDisputes(@Query('status') status?: string, @Query('search') search?: string) {
    return this.adminService.listAllDisputes({ status, search });
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

  @Patch('disputes/:id/reopen')
  @ApiOperation({ summary: 'Reopen a dispute (admin)' })
  reopenDispute(@Param('id') id: string) {
    return this.adminService.reopenDispute(id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders' })
  listOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listAllOrders({ status, search });
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Force update order status (admin)' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.forceUpdateOrderStatus(id, status);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listUsers({ search, role, status });
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user role/status' })
  updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; status?: string },
  ) {
    return this.adminService.updateUser(id, body);
  }

  @Post('users/bulk-update')
  @ApiOperation({ summary: 'Bulk update users role/status' })
  bulkUpdateUsers(
    @Body() body: { userIds: string[]; role?: string; status?: string },
  ) {
    return this.adminService.bulkUpdateUsers(body.userIds, { role: body.role, status: body.status });
  }

  @Get('orgs')
  @ApiOperation({ summary: 'List all organisations' })
  listOrgs(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listOrgs({ search, status });
  }

  @Patch('orgs/:id')
  @ApiOperation({ summary: 'Update organisation status' })
  updateOrg(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateOrgStatus(id, body.status);
  }

  @Post('orgs/bulk-status')
  @ApiOperation({ summary: 'Bulk update organisation status' })
  bulkUpdateOrgs(
    @Body() body: { orgIds: string[]; status: string },
  ) {
    return this.adminService.bulkUpdateOrgStatus(body.orgIds, body.status);
  }

  @Get('refunds')
  @ApiOperation({ summary: 'List all refunds' })
  listRefunds(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('minAmountPaisa') minAmountPaisa?: string,
  ) {
    return this.adminService.listRefunds({ status, search, minAmountPaisa });
  }

  @Patch('refunds/:id')
  @ApiOperation({ summary: 'Update refund status' })
  updateRefund(
    @Param('id') id: string,
    @Body() body: { status: string; providerRefundId?: string },
  ) {
    return this.adminService.updateRefund(id, body.status, body.providerRefundId);
  }

  @Post('refunds/bulk-status')
  @ApiOperation({ summary: 'Bulk update refund status' })
  bulkUpdateRefunds(
    @Body() body: { refundIds: string[]; status: string },
  ) {
    return this.adminService.bulkUpdateRefundStatus(body.refundIds, body.status);
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

  @Get('exports/users.csv')
  @ApiOperation({ summary: 'Export users CSV' })
  async exportUsersCsv(@Res() res: Response) {
    const csv = await this.adminService.exportUsersCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="admin-users.csv"');
    res.send(csv);
  }

  @Get('exports/orgs.csv')
  @ApiOperation({ summary: 'Export organisations CSV' })
  async exportOrgsCsv(@Res() res: Response) {
    const csv = await this.adminService.exportOrgsCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="admin-orgs.csv"');
    res.send(csv);
  }

  @Get('exports/orders.csv')
  @ApiOperation({ summary: 'Export orders CSV' })
  async exportOrdersCsv(@Res() res: Response) {
    const csv = await this.adminService.exportOrdersCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="admin-orders.csv"');
    res.send(csv);
  }

  @Get('exports/disputes.csv')
  @ApiOperation({ summary: 'Export disputes CSV' })
  async exportDisputesCsv(@Res() res: Response) {
    const csv = await this.adminService.exportDisputesCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="admin-disputes.csv"');
    res.send(csv);
  }

  @Get('exports/refunds.csv')
  @ApiOperation({ summary: 'Export refunds CSV' })
  async exportRefundsCsv(@Res() res: Response) {
    const csv = await this.adminService.exportRefundsCsv();
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="admin-refunds.csv"');
    res.send(csv);
  }
}

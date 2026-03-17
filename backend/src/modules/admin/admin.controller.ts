import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('verification-cases')
  @ApiOperation({ summary: 'List pending verification cases' })
  async listVerificationCases(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminService.listVerificationCases(user.id, status, cursor);
  }

  @Post('verification-cases/:caseId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Review verification case (approve/reject)' })
  async reviewVerificationCase(
    @Param('caseId') caseId: string,
    @Body() body: { decision: 'approved' | 'rejected'; notes: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.reviewVerificationCase(caseId, user.id, body.decision, body.notes);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List disputes for admin review' })
  async listDisputes(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.adminService.listDisputes(user.id, status);
  }

  @Post('disputes/:disputeId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve dispute' })
  async resolveDispute(
    @Param('disputeId') disputeId: string,
    @Body() body: { decision: 'refund' | 'no_refund'; notes: string; refund_amount_minor?: number },
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.adminService.resolveDispute(
      disputeId,
      user.id,
      body.decision,
      body.notes,
      body.refund_amount_minor,
      idempotencyKey,
    );
  }

  @Post('payment-intents/:intentId/risk-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear or refund risk-held payment' })
  async riskReview(
    @Param('intentId') intentId: string,
    @Body() body: { decision: 'clear' | 'refund'; notes?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.reviewRiskHold(intentId, user.id, body.decision, body.notes);
  }

  @Get('orgs')
  @ApiOperation({ summary: 'List orgs' })
  async listOrgs(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.adminService.listOrgs(user.id, status);
  }

  @Patch('orgs/:orgId/status')
  @ApiOperation({ summary: 'Update org status (suspend/activate)' })
  async updateOrgStatus(
    @Param('orgId') orgId: string,
    @Body() body: { status: 'active' | 'suspended' },
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.updateOrgStatus(orgId, user.id, body.status);
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Block/unblock user' })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: { status: 'active' | 'blocked' },
    @CurrentUser() adminUser: AuthUser,
  ) {
    return this.adminService.updateUserStatus(userId, adminUser.id, body.status);
  }
}

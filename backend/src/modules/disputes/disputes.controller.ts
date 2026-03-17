import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DisputesService } from './disputes.service';
import { DisputeReason } from './entities/dispute.entity';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('disputes')
@Controller('api/v1')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('orders/:orderId/disputes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open dispute for an order (buyer)' })
  async openDispute(
    @Param('orderId') orderId: string,
    @Body() body: { reason: DisputeReason; description: string; access_code?: string },
    @Query('access_code') accessCode?: string,
  ) {
    // Allow buyer auth or guest via access_code
    return this.disputesService.openDispute(
      orderId,
      'guest',
      body.reason,
      body.description,
      body.access_code || accessCode,
    );
  }

  @Get('disputes/:disputeId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get dispute detail' })
  async getDispute(@Param('disputeId') disputeId: string, @CurrentUser() _user: AuthUser) {
    return this.disputesService.getDispute(disputeId);
  }

  @Post('disputes/:disputeId/evidence')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Submit evidence for dispute' })
  async submitEvidence(
    @Param('disputeId') disputeId: string,
    @Body() body: { evidence: Array<{ object_key: string; mime_type: string; description?: string }> },
    @CurrentUser() user: AuthUser,
  ) {
    return this.disputesService.submitEvidence(disputeId, user.id, body.evidence);
  }
}

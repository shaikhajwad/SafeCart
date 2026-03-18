import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('disputes')
@Controller('api/v1')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('orders/:id/disputes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a dispute for an order' })
  openDispute(
    @Param('id') orderId: string,
    @Body() dto: CreateDisputeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.disputesService.openDispute(orderId, user.id, dto);
  }

  @Get('orders/:id/disputes')
  @ApiOperation({ summary: 'List disputes for an order' })
  listForOrder(@Param('id') orderId: string) {
    return this.disputesService.listForOrder(orderId);
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute details' })
  findOne(@Param('id') id: string) {
    return this.disputesService.findById(id);
  }

  @Post('disputes/:id/evidence')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload evidence for a dispute' })
  addEvidence(
    @Param('id') id: string,
    @Body() body: { fileKey: string; description?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.disputesService.addEvidence(id, user.id, body.fileKey, body.description);
  }

  @Patch('disputes/:id/resolve')
  @Roles('admin', 'support_agent')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Resolve a dispute (admin/support)' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.disputesService.resolve(id, dto, user.id);
  }
}

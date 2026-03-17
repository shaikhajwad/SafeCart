import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LogisticsService } from './logistics.service';
import { CourierProvider, ShipmentStatus } from './entities/shipment.entity';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('logistics')
@Controller('api/v1')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('orders/:orderId/courier-quotes')
  @ApiOperation({ summary: 'Get courier quotes for order' })
  async getQuotes(@Param('orderId') orderId: string) {
    return this.logisticsService.getQuotes(orderId);
  }

  @Post('orders/:orderId/shipments')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Book courier shipment (seller)' })
  async bookShipment(
    @Param('orderId') orderId: string,
    @Body() body: { provider: CourierProvider },
    @CurrentUser() user: AuthUser,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.logisticsService.bookShipment(orderId, user.id, body.provider, idempotencyKey);
  }

  @Get('shipments/:shipmentId/track')
  @ApiOperation({ summary: 'Track shipment status' })
  async trackShipment(@Param('shipmentId') shipmentId: string) {
    return this.logisticsService.trackShipment(shipmentId);
  }

  @Post('shipments/:shipmentId/events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Courier webhook: update shipment status' })
  async updateShipmentStatus(
    @Param('shipmentId') shipmentId: string,
    @Body() body: { status: ShipmentStatus; payload?: Record<string, unknown> },
  ) {
    await this.logisticsService.updateShipmentStatus(shipmentId, body.status, body.payload);
    return { ok: true };
  }
}

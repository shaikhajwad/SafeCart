import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { BookShipmentDto } from './dto/book-shipment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('logistics')
@Controller('api/v1')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('orders/:id/shipments/quote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get shipping quotes for order' })
  getQuotes(@Param('id') id: string) {
    return this.logisticsService.getQuotes(id);
  }

  @Post('orders/:id/shipments/book')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book a shipment for order' })
  book(@Param('id') id: string, @Body() dto: BookShipmentDto) {
    return this.logisticsService.bookShipment(id, dto);
  }

  @Get('orders/:id/shipments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get shipment info for order' })
  getShipment(@Param('id') id: string) {
    return this.logisticsService.getShipment(id);
  }

  @Post('webhooks/logistics/pathao')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pathao courier webhook' })
  pathaoWebhook(@Body() payload: Record<string, unknown>) {
    return this.logisticsService.handlePathaoWebhook(payload);
  }

  @Get('shipments/:id/track')
  @ApiOperation({ summary: 'Get public tracking info' })
  track(@Param('id') id: string) {
    return this.logisticsService.track(id);
  }
}

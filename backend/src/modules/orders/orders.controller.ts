import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('api/v1')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout-sessions/:token/orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buyer creates an order from checkout session' })
  createOrder(
    @Param('token') token: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCheckout(token, dto);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get order details (buyer with access_code or seller)' })
  @ApiQuery({ name: 'access_code', required: false })
  getOrder(
    @Param('id') id: string,
    @Query('access_code') accessCode?: string,
  ) {
    return this.ordersService.findByIdWithAccess(id, accessCode);
  }

  @Get('orders/:id/track')
  @ApiOperation({ summary: 'Public order tracking' })
  @ApiQuery({ name: 'access_code', required: false })
  trackOrder(
    @Param('id') id: string,
    @Query('access_code') accessCode?: string,
  ) {
    return this.ordersService.trackOrder(id, accessCode);
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Advance order status (admin/seller)' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.advanceStatus(id, status);
  }

  @Get('orgs/:orgId/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List orders for org (seller)' })
  listOrgOrders(@Param('orgId') orgId: string) {
    return this.ordersService.findByOrg(orgId);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  CheckoutService,
  CreateCheckoutSessionDto,
  ConvertCheckoutDto,
} from './checkout.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('checkout')
@Controller('api/v1')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('checkout/sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create shareable checkout link (seller)' })
  async createSession(@Body() dto: CreateCheckoutSessionDto, @CurrentUser() user: AuthUser) {
    return this.checkoutService.createSession(user.id, dto);
  }

  @Get('checkout/sessions/:token')
  @ApiOperation({ summary: 'Get public checkout data (buyer)' })
  async getSession(@Param('token') token: string) {
    return this.checkoutService.getSession(token);
  }

  @Post('checkout/sessions/:token/convert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Convert checkout session to order (buyer)' })
  async convertSession(@Param('token') token: string, @Body() dto: ConvertCheckoutDto) {
    return this.checkoutService.convertSession(token, dto);
  }

  @Get('orders/:orderId/public')
  @ApiOperation({ summary: 'Buyer public order status (no auth, needs access_code)' })
  async getOrderPublic(
    @Param('orderId') orderId: string,
    @Query('access_code') accessCode: string,
  ) {
    return this.checkoutService.getOrderPublic(orderId, accessCode);
  }

  @Get('orgs/:orgId/orders')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List orders (seller)' })
  async listOrders(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.checkoutService.listOrders(orgId, user.id, status, cursor);
  }

  @Get('orgs/:orgId/orders/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Order detail (seller)' })
  async getOrderDetail(
    @Param('orgId') orgId: string,
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checkoutService.getOrderDetail(orgId, orderId, user.id);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('api/v1')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/payments/initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate payment for an order (seller/admin)' })
  initiate(
    @Param('id') id: string,
    @Body() dto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.initiatePayment(id, dto.provider, idempotencyKey);
  }

  @Post('orders/:id/payments/initiate/buyer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate payment for an order as a buyer (uses access_code)' })
  @ApiQuery({ name: 'access_code', required: true, description: 'Order access code provided at checkout' })
  initiateBuyer(
    @Param('id') id: string,
    @Query('access_code') accessCode: string,
    @Body() dto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.initiateBuyerPayment(id, accessCode, dto.provider, idempotencyKey);
  }

  @Post('webhooks/payments/sslcommerz/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SSLCommerz IPN handler' })
  async sslcommerzIpn(@Body() payload: Record<string, string>) {
    await this.paymentsService.handleSslcommerzIPN(payload);
    return { status: 'received' };
  }

  @Post('webhooks/payments/bkash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bKash webhook handler' })
  async bkashWebhook(@Body() payload: Record<string, unknown>) {
    await this.paymentsService.handleBkashWebhook(payload);
    return { status: 'received' };
  }

  @Post('orders/:id/payments/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initiate a refund' })
  refund(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.initiateRefund(id, reason, user.id);
  }

  @Get('orders/:id/payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List payment intents for an order' })
  listPayments(@Param('id') id: string) {
    return this.paymentsService.listByOrder(id);
  }
}

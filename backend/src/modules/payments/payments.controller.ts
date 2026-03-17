import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from './entities/payment-intent.entity';

@ApiTags('payments')
@Controller('api/v1')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/payments/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate payment for an order' })
  async initiatePayment(
    @Param('orderId') orderId: string,
    @Body() body: { provider: PaymentProvider; mode?: string },
    @Headers('idempotency-key') idempotencyKey: string,
    @Query('access_code') accessCode?: string,
  ) {
    if (!idempotencyKey) {
      throw new Error('Idempotency-Key header required');
    }
    return this.paymentsService.initiatePayment(orderId, body.provider, idempotencyKey, accessCode);
  }

  @Get('orders/:orderId/payments/status')
  @ApiOperation({ summary: 'Poll payment status' })
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @Query('access_code') accessCode?: string,
  ) {
    return this.paymentsService.getPaymentStatus(orderId, accessCode);
  }

  @Post('webhooks/payments/sslcommerz/ipn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SSLCOMMERZ IPN webhook' })
  async sslCommerzIpn(@Body() body: Record<string, unknown>) {
    // Respond immediately, then process async
    // Per SSLCOMMERZ spec, respond 200 OK quickly
    this.paymentsService.handleSslCommerzIpn(body).catch((err) => {
      // Log but don't re-throw - IPN processing is async
      console.error('SSLCOMMERZ IPN processing error:', err);
    });
    return { status: 'received' };
  }

  @Post('orders/:orderId/refunds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate refund for an order' })
  async initiateRefund(
    @Param('orderId') orderId: string,
    @Body() body: { amount_minor: number; reason: string },
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    return this.paymentsService.initiateRefund(
      orderId,
      body.amount_minor,
      body.reason,
      idempotencyKey,
    );
  }
}

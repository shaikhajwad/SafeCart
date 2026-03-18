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
import { CheckoutService } from './checkout.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('checkout')
@Controller('api/checkout-sessions')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a checkout session link (seller)' })
  create(@Body() dto: CreateCheckoutSessionDto, @CurrentUser() user: AuthUser) {
    return this.checkoutService.create(dto, user.id);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get checkout session by token (public, for buyer)' })
  findByToken(@Param('token') token: string) {
    return this.checkoutService.findByToken(token);
  }
}

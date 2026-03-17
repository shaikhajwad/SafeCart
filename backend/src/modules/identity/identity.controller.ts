import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { IdentityService } from './identity.service';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({ status: 200, description: 'OTP sent or rate limited' })
  async sendOtp(@Body() dto: SendOtpDto) {
    try {
      return await this.identityService.sendOtp(dto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      if (message === 'provider_error') {
        throw new BadRequestException({ error: { code: 'provider_error', message: 'SMS provider error' } });
      }
      throw err;
    }
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and issue tokens' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    try {
      const deviceInfo = { userAgent: req.headers['user-agent'], ip: req.ip };
      return await this.identityService.verifyOtp(dto, deviceInfo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      if (message === 'otp_expired') {
        throw new BadRequestException({ error: { code: 'otp_expired', message: 'OTP has expired' } });
      }
      if (message === 'otp_invalid') {
        throw new BadRequestException({ error: { code: 'otp_invalid', message: 'Invalid OTP' } });
      }
      if (message === 'locked') {
        throw new HttpException({ error: { code: 'locked', message: 'Too many failed attempts' } }, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (message === 'user_blocked') {
        throw new ForbiddenException({ error: { code: 'user_blocked', message: 'Account is blocked' } });
      }
      throw err;
    }
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Req() req: FastifyRequest) {
    const sessionId = (req as FastifyRequest & { sessionId?: string }).sessionId;
    const refreshToken = (req as FastifyRequest & { rawRefreshToken?: string }).rawRefreshToken;
    if (!sessionId || !refreshToken) {
      throw new UnauthorizedException({ error: { code: 'refresh_invalid', message: 'Invalid refresh token' } });
    }
    try {
      return await this.identityService.refreshToken(sessionId, refreshToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown_error';
      throw new UnauthorizedException({ error: { code: message, message: 'Token refresh failed' } });
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke session' })
  async logout(@Req() req: FastifyRequest) {
    const sessionId = (req as FastifyRequest & { sessionId?: string }).sessionId;
    if (sessionId) {
      await this.identityService.logout(sessionId);
    }
    return { ok: true };
  }
}

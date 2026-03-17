import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { User } from './entities/user.entity';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private otpService: OtpService,
    private tokenService: TokenService,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; retryAfterSeconds?: number }> {
    const { allowed, retryAfter } = await this.otpService.checkRateLimit(dto.phone);

    if (!allowed) {
      throw new BadRequestException({
        error: {
          code: 'OTP_RATE_LIMIT',
          message: 'Too many OTP requests. Please wait before trying again.',
          details: { retryAfterSeconds: retryAfter },
        },
      });
    }

    const otp = this.otpService.generateOtp();
    await this.otpService.storeOtp(dto.phone, otp);

    // In production, integrate with SMS provider (e.g., SSL Wireless, Infobip)
    this.logger.log(`OTP for ${dto.phone}: ${otp}`); // Remove in production

    return { message: 'OTP sent successfully', retryAfterSeconds: 300 };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean }> {
    const valid = await this.otpService.verifyOtp(dto.phone, dto.otp);

    if (!valid) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' },
      });
    }

    let user = await this.userRepo.findOne({ where: { phoneE164: dto.phone } });
    const isNewUser = !user;

    if (!user) {
      user = this.userRepo.create({ phoneE164: dto.phone, role: 'buyer' });
      await this.userRepo.save(user);
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException({
        error: { code: 'ACCOUNT_BLOCKED', message: 'Account is blocked' },
      });
    }

    const { accessToken, refreshToken } = await this.tokenService.createTokenPair(user, meta);

    return { accessToken, refreshToken, isNewUser };
  }

  async refreshToken(
    sessionId: string,
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.tokenService.rotateRefreshToken(sessionId, rawRefreshToken);
    if (!tokens) {
      throw new UnauthorizedException({
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' },
      });
    }
    return tokens;
  }

  async logout(sessionId: string): Promise<void> {
    await this.tokenService.revokeSession(sessionId);
  }
}

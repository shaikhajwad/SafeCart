import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';

// OTP storage interface - uses Redis via cache abstraction
export abstract class OtpStore {
  abstract set(key: string, value: string, ttlSeconds: number): Promise<void>;
  abstract get(key: string): Promise<string | null>;
  abstract del(key: string): Promise<void>;
  abstract increment(key: string, ttlSeconds: number): Promise<number>;
}

export abstract class SmsProvider {
  abstract send(to: string, message: string): Promise<void>;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly OTP_TTL = 300; // 5 minutes
  private readonly OTP_MAX_ATTEMPTS = 5;
  private readonly OTP_RATE_LIMIT_TTL = 60; // 1 minute window
  private readonly OTP_RATE_LIMIT_MAX = 3; // max sends per window

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly otpStore: OtpStore,
    private readonly smsProvider: SmsProvider,
  ) {}

  async sendOtp(dto: SendOtpDto): Promise<{ otp_sent: boolean; retry_after_seconds: number }> {
    const rateLimitKey = `otp:rate:${dto.phone_e164}`;
    const count = await this.otpStore.increment(rateLimitKey, this.OTP_RATE_LIMIT_TTL);

    if (count > this.OTP_RATE_LIMIT_MAX) {
      return { otp_sent: false, retry_after_seconds: this.OTP_RATE_LIMIT_TTL };
    }

    const otp = this.generateOtp();
    const otpKey = `otp:value:${dto.phone_e164}`;
    const attemptsKey = `otp:attempts:${dto.phone_e164}`;

    // Store OTP as hashed value
    const otpHash = await bcrypt.hash(otp, 10);
    await this.otpStore.set(otpKey, otpHash, this.OTP_TTL);
    await this.otpStore.del(attemptsKey);

    try {
      await this.smsProvider.send(
        dto.phone_e164,
        `Your SafeCart verification code is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      );
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${dto.phone_e164}`, err);
      throw new Error('provider_error');
    }

    this.logger.log(`OTP sent to ${dto.phone_e164}`);
    return { otp_sent: true, retry_after_seconds: this.OTP_RATE_LIMIT_TTL };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    deviceInfo?: Record<string, unknown>,
  ): Promise<{ access_token: string; user: { id: string; phone_e164: string } }> {
    const otpKey = `otp:value:${dto.phone_e164}`;
    const attemptsKey = `otp:attempts:${dto.phone_e164}`;

    // Check if locked out
    const attempts = await this.otpStore.get(attemptsKey);
    if (attempts && parseInt(attempts, 10) >= this.OTP_MAX_ATTEMPTS) {
      throw new Error('locked');
    }

    const storedOtpHash = await this.otpStore.get(otpKey);
    if (!storedOtpHash) {
      throw new Error('otp_expired');
    }

    const isValid = await bcrypt.compare(dto.otp, storedOtpHash);
    if (!isValid) {
      await this.otpStore.increment(attemptsKey, this.OTP_TTL);
      throw new Error('otp_invalid');
    }

    // OTP valid - invalidate it (one-time use)
    await this.otpStore.del(otpKey);
    await this.otpStore.del(attemptsKey);

    // Upsert user
    let user = await this.userRepo.findOne({ where: { phoneE164: dto.phone_e164 } });
    if (!user) {
      user = this.userRepo.create({
        phoneE164: dto.phone_e164,
        status: UserStatus.ACTIVE,
      });
      await this.userRepo.save(user);
    } else if (user.status !== UserStatus.ACTIVE) {
      throw new Error('user_blocked');
    }

    // Create session
    const refreshToken = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn', '30d');
    const expiresAt = this.parseExpiry(refreshExpiresIn);

    const session = this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      deviceInfo: deviceInfo || null,
    });
    await this.sessionRepo.save(session);

    const accessToken = await this.issueAccessToken(user.id, session.id);

    return {
      access_token: accessToken,
      user: { id: user.id, phone_e164: user.phoneE164! },
    };
  }

  async refreshToken(
    sessionId: string,
    rawRefreshToken: string,
  ): Promise<{ access_token: string }> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new Error('refresh_expired');
    }

    const isValid = await bcrypt.compare(rawRefreshToken, session.refreshTokenHash);
    if (!isValid) {
      throw new Error('refresh_invalid');
    }

    // Rotate refresh token
    const newRefreshToken = uuidv4();
    const newHash = await bcrypt.hash(newRefreshToken, 10);
    session.refreshTokenHash = newHash;
    await this.sessionRepo.save(session);

    const accessToken = await this.issueAccessToken(session.userId, session.id);
    return { access_token: accessToken };
  }

  async logout(sessionId: string): Promise<{ ok: boolean }> {
    await this.sessionRepo.update({ id: sessionId }, { revokedAt: new Date() });
    return { ok: true };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async issueAccessToken(userId: string, sessionId: string): Promise<string> {
    const payload = { sub: userId, sid: sessionId };
    return this.jwtService.sign(payload);
  }

  private parseExpiry(expiry: string): Date {
    const now = new Date();
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(now.getTime() + value * multipliers[unit]);
  }
}

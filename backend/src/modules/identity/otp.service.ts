import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';

const OTP_TTL = 300; // 5 minutes
const RATE_LIMIT_TTL = 600; // 10 minutes
const RATE_LIMIT_MAX = 3;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class OtpService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  private otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  private rateKey(phone: string): string {
    return `otp_rate:${phone}`;
  }

  async checkRateLimit(phone: string): Promise<{ allowed: boolean; retryAfter: number }> {
    const key = this.rateKey(phone);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, RATE_LIMIT_TTL);
    }
    const ttl = await this.redis.ttl(key);

    if (count > RATE_LIMIT_MAX) {
      return { allowed: false, retryAfter: ttl };
    }
    return { allowed: true, retryAfter: 0 };
  }

  async storeOtp(phone: string, otp: string): Promise<void> {
    const hash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
    await this.redis.set(this.otpKey(phone), hash, 'EX', OTP_TTL);
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const hash = await this.redis.get(this.otpKey(phone));
    if (!hash) return false;
    const valid = await bcrypt.compare(otp, hash);
    if (valid) {
      await this.redis.del(this.otpKey(phone));
    }
    return valid;
  }

  generateOtp(): string {
    const digits = Math.floor(100000 + Math.random() * 900000);
    return digits.toString();
  }
}

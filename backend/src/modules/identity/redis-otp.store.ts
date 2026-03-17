import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { OtpStore } from './identity.service';

@Injectable()
export class RedisOtpStore implements OtpStore {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.cache.set(key, value, ttlSeconds * 1000);
  }

  async get(key: string): Promise<string | null> {
    return (await this.cache.get<string>(key)) ?? null;
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    const current = await this.cache.get<number>(key);
    const next = (current ?? 0) + 1;
    await this.cache.set(key, next, ttlSeconds * 1000);
    return next;
  }
}

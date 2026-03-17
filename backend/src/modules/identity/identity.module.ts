import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { IdentityService, OtpStore, SmsProvider } from './identity.service';
import { IdentityController } from './identity.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisOtpStore } from './redis-otp.store';
import { SmsProviderAdapter } from './sms-provider.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>('redis.host', 'localhost'),
        port: config.get<number>('redis.port', 6379),
        password: config.get<string>('redis.password'),
        ttl: 300,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [IdentityController],
  providers: [
    IdentityService,
    JwtStrategy,
    {
      provide: OtpStore,
      useClass: RedisOtpStore,
    },
    {
      provide: SmsProvider,
      useClass: SmsProviderAdapter,
    },
  ],
  exports: [IdentityService, JwtModule, PassportModule],
})
export class IdentityModule {}

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';

// Feature modules
import { IdentityModule } from './modules/identity/identity.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { VerificationModule } from './modules/verification/verification.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';

// Job processors
import { EscrowReleaseProcessor } from './jobs/escrow-release.processor';
import { CourierPollingProcessor } from './jobs/courier-polling.processor';
import { SlaEnforcerProcessor } from './jobs/sla-enforcer.processor';
import { PaymentReconciliationProcessor } from './jobs/payment-reconciliation.processor';

// Entities for job processors
import { Shipment } from './modules/logistics/entities/shipment.entity';
import { Order } from './modules/orders/entities/order.entity';
import { PaymentIntent } from './modules/payments/entities/payment-intent.entity';

import Redis from 'ioredis';

@Global()
@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Shipment, Order, PaymentIntent]),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    ScheduleModule.forRoot(),
    // Feature modules
    IdentityModule,
    OrgsModule,
    VerificationModule,
    CatalogModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    LogisticsModule,
    DisputesModule,
    NotificationsModule,
    AdminModule,
    AuditModule,
  ],
  providers: [
    AppService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379');
      },
      inject: [ConfigService],
    },
    EscrowReleaseProcessor,
    CourierPollingProcessor,
    SlaEnforcerProcessor,
    PaymentReconciliationProcessor,
  ],
  exports: ['REDIS_CLIENT'],
})
export class AppModule {}

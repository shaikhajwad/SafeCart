import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Shipment, ShipmentEvent } from './entities/shipment.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { PathaoAdapter } from './adapters/pathao/pathao.adapter';
import { PaperflyAdapter } from './adapters/paperfly/paperfly.adapter';
import { EcourierAdapter } from './adapters/ecourier/ecourier.adapter';
import { RedxAdapter } from './adapters/redx/redx.adapter';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, ShipmentEvent]),
    HttpModule,
    CheckoutModule,
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService, PathaoAdapter, PaperflyAdapter, EcourierAdapter, RedxAdapter],
  exports: [LogisticsService, TypeOrmModule],
})
export class LogisticsModule {}

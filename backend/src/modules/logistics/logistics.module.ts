import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { Shipment } from './entities/shipment.entity';
import { ShipmentEvent } from './entities/shipment-event.entity';
import { PathaoAdapter } from './adapters/pathao/pathao.adapter';
import { PaperflyAdapter } from './adapters/paperfly/paperfly.adapter';
import { RedxAdapter } from './adapters/redx/redx.adapter';
import { EcourierAdapter } from './adapters/ecourier/ecourier.adapter';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, ShipmentEvent]), OrdersModule],
  controllers: [LogisticsController],
  providers: [LogisticsService, PathaoAdapter, PaperflyAdapter, RedxAdapter, EcourierAdapter],
  exports: [LogisticsService],
})
export class LogisticsModule {}

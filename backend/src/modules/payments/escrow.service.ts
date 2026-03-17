import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscrowHold } from './entities/escrow-hold.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

const ESCROW_RELEASE_DAYS = 7; // auto-release after 7 days of delivery

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(EscrowHold) private holdRepo: Repository<EscrowHold>,
    private ordersService: OrdersService,
  ) {}

  async createHold(orderId: string, orgId: string, amountPaisa: number): Promise<EscrowHold> {
    const releaseAfter = new Date();
    releaseAfter.setDate(releaseAfter.getDate() + ESCROW_RELEASE_DAYS);

    const hold = this.holdRepo.create({
      orderId,
      orgId,
      heldPaisa: amountPaisa,
      status: 'held',
      releaseAfter,
    });
    return this.holdRepo.save(hold);
  }

  async releaseHold(orderId: string): Promise<EscrowHold> {
    const hold = await this.holdRepo.findOne({ where: { orderId } });
    if (!hold) {
      throw new NotFoundException({ error: { code: 'HOLD_NOT_FOUND', message: 'Escrow hold not found' } });
    }
    hold.status = 'released';
    hold.releasedAt = new Date();
    await this.holdRepo.save(hold);

    // Advance order to COMPLETED
    await this.ordersService.advanceStatus(orderId, OrderStatus.COMPLETED);
    return hold;
  }

  async freezeHold(orderId: string): Promise<EscrowHold> {
    const hold = await this.holdRepo.findOne({ where: { orderId } });
    if (!hold) throw new NotFoundException({ error: { code: 'HOLD_NOT_FOUND', message: 'Escrow hold not found' } });
    hold.status = 'dispute_frozen';
    return this.holdRepo.save(hold);
  }

  async refundHold(orderId: string): Promise<EscrowHold> {
    const hold = await this.holdRepo.findOne({ where: { orderId } });
    if (!hold) throw new NotFoundException({ error: { code: 'HOLD_NOT_FOUND', message: 'Escrow hold not found' } });
    hold.status = 'refunded';
    hold.releasedAt = new Date();
    return this.holdRepo.save(hold);
  }

  async findDueForRelease(): Promise<EscrowHold[]> {
    return this.holdRepo
      .createQueryBuilder('h')
      .where('h.status = :status', { status: 'held' })
      .andWhere('h.release_after <= :now', { now: new Date() })
      .getMany();
  }
}

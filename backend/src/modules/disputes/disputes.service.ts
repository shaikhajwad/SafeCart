import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import { DisputeEvidence } from './entities/dispute-evidence.entity';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(DisputeEvidence) private evidenceRepo: Repository<DisputeEvidence>,
    private ordersService: OrdersService,
  ) {}

  async openDispute(orderId: string, userId: string, dto: CreateDisputeDto): Promise<Dispute> {
    const dispute = this.disputeRepo.create({
      orderId,
      raisedByUserId: userId,
      reason: dto.reason,
      status: 'open',
    });
    await this.disputeRepo.save(dispute);

    await this.ordersService.advanceStatus(orderId, OrderStatus.DISPUTE_OPEN);
    return dispute;
  }

  async listForOrder(orderId: string): Promise<Dispute[]> {
    return this.disputeRepo.find({ where: { orderId }, relations: ['evidence'] });
  }

  async findById(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({ where: { id }, relations: ['evidence'] });
    if (!dispute) {
      throw new NotFoundException({ error: { code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found' } });
    }
    return dispute;
  }

  async addEvidence(
    disputeId: string,
    userId: string,
    fileKey: string,
    description?: string,
  ): Promise<DisputeEvidence> {
    await this.findById(disputeId);
    const evidence = this.evidenceRepo.create({
      disputeId,
      submittedByUserId: userId,
      fileKey,
      description,
    });
    return this.evidenceRepo.save(evidence);
  }

  async resolve(id: string, dto: ResolveDisputeDto, resolvedBy: string): Promise<Dispute> {
    const dispute = await this.findById(id);
    dispute.status = dto.resolution;
    dispute.resolutionNotes = dto.notes ?? '';
    dispute.resolvedByUserId = resolvedBy;
    dispute.resolvedAt = new Date();
    return this.disputeRepo.save(dispute);
  }

  async listAll(): Promise<Dispute[]> {
    return this.disputeRepo.find({ order: { createdAt: 'DESC' }, relations: ['evidence'] });
  }
}

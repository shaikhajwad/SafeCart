import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Dispute, DisputeEvidence, DisputeStatus, DisputeReason } from './entities/dispute.entity';
import { Order, OrderStatus } from '../checkout/entities/order.entity';
import { CheckoutService } from '../checkout/checkout.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);

  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(DisputeEvidence)
    private readonly evidenceRepo: Repository<DisputeEvidence>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly checkoutService: CheckoutService,
    private readonly paymentsService: PaymentsService,
    private readonly dataSource: DataSource,
  ) {}

  async openDispute(
    orderId: string,
    userId: string,
    reason: DisputeReason,
    description: string,
    accessCode?: string,
  ): Promise<{ dispute_id: string }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Order not found' } });
    }

    // Buyer access validation
    if (accessCode && order.buyerAccessCode !== accessCode) {
      throw new ForbiddenException({ error: { code: 'forbidden', message: 'Invalid access code' } });
    }

    if (order.status !== OrderStatus.DISPUTE_WINDOW) {
      throw new BadRequestException({
        error: {
          code: 'invalid_state',
          message: 'Dispute can only be opened during DISPUTE_WINDOW state',
        },
      });
    }

    const existing = await this.disputeRepo.findOne({ where: { orderId } });
    if (existing) {
      throw new BadRequestException({ error: { code: 'dispute_exists', message: 'A dispute already exists for this order' } });
    }

    return await this.dataSource.transaction(async (manager) => {
      const dispute = manager.create(Dispute, {
        orderId,
        openedBy: userId,
        reason,
        description,
        status: DisputeStatus.OPEN,
      });
      await manager.save(dispute);

      await this.checkoutService.transitionOrder(orderId, OrderStatus.DISPUTE_OPEN, {
        dispute_id: dispute.id,
        reason,
      });

      return { dispute_id: dispute.id };
    });
  }

  async getDispute(disputeId: string): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
      relations: ['evidence'],
    });
    if (!dispute) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Dispute not found' } });
    }
    return dispute;
  }

  async submitEvidence(
    disputeId: string,
    userId: string,
    evidence: Array<{ object_key: string; mime_type: string; description?: string }>,
  ): Promise<{ ok: boolean }> {
    const dispute = await this.disputeRepo.findOneOrFail({ where: { id: disputeId } });

    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.EVIDENCE_SUBMITTED) {
      throw new BadRequestException({ error: { code: 'invalid_state', message: 'Cannot submit evidence in current dispute status' } });
    }

    const docs = evidence.map((e) =>
      this.evidenceRepo.create({
        disputeId,
        uploadedBy: userId,
        objectKey: e.object_key,
        mimeType: e.mime_type,
        description: e.description || null,
      }),
    );
    await this.evidenceRepo.save(docs);

    await this.disputeRepo.update({ id: disputeId }, { status: DisputeStatus.EVIDENCE_SUBMITTED });

    return { ok: true };
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    decision: 'refund' | 'no_refund',
    notes: string,
    refundAmountMinor?: number,
    idempotencyKey?: string,
  ): Promise<{ ok: boolean }> {
    const dispute = await this.disputeRepo.findOneOrFail({ where: { id: disputeId } });

    const newStatus =
      decision === 'refund' ? DisputeStatus.RESOLVED_REFUND : DisputeStatus.RESOLVED_NO_REFUND;

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Dispute, { id: disputeId }, {
        status: newStatus,
        resolvedBy: adminId,
        resolutionNotes: notes,
        refundAmountMinor: refundAmountMinor || null,
      });

      if (decision === 'refund' && refundAmountMinor && refundAmountMinor > 0) {
        await this.paymentsService.initiateRefund(
          dispute.orderId,
          refundAmountMinor,
          `Dispute ${disputeId} resolved in buyer's favor`,
          idempotencyKey || `dispute_refund_${disputeId}`,
        );
        await this.checkoutService.transitionOrder(dispute.orderId, OrderStatus.REFUNDED, {
          dispute_id: disputeId,
          resolved_by: adminId,
        });
      } else {
        await this.checkoutService.transitionOrder(dispute.orderId, OrderStatus.COMPLETED, {
          dispute_id: disputeId,
          resolved_by: adminId,
          decision: 'no_refund',
        });
      }
    });

    return { ok: true };
  }
}

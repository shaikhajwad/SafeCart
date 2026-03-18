import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { Org } from '../orgs/entities/org.entity';
import { VerificationService } from '../verification/verification.service';
import { OrdersService } from '../orders/orders.service';
import { ORDER_TRANSITIONS, OrderStatus } from '../orders/entities/order.entity';
import { EscrowHold } from '../payments/entities/escrow-hold.entity';
import { EscrowService } from '../payments/escrow.service';
import { DisputesService } from '../disputes/disputes.service';
import { ResolveDisputeDto } from '../disputes/dto/resolve-dispute.dto';
import { User } from '../identity/entities/user.entity';
import { Refund } from '../payments/entities/refund.entity';

const USER_ROLES = ['buyer', 'seller_owner', 'seller_staff', 'support_agent', 'admin'];
const USER_STATUSES = ['active', 'blocked', 'deleted'];
const ORG_STATUSES = ['pending_verification', 'active', 'suspended', 'closed'];
const REFUND_STATUSES = ['pending', 'processing', 'completed', 'failed'];

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(Org) private orgRepo: Repository<Org>,
    @InjectRepository(EscrowHold) private holdRepo: Repository<EscrowHold>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    private verificationService: VerificationService,
    private ordersService: OrdersService,
    private escrowService: EscrowService,
    private disputesService: DisputesService,
  ) {}

  async getDashboardStats() {
    const [totalOrders, disputeCount, totalOrgs, pendingCases, recentOrders] = await Promise.all([
      this.orderRepo.count(),
      this.disputeRepo.count({ where: { status: 'open' } }),
      this.orgRepo.count(),
      this.verificationService.listPendingCases(),
      this.orderRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalOrders,
      openDisputes: disputeCount,
      totalOrgs,
      pendingVerifications: pendingCases.length,
      recentOrders,
    };
  }

  async listPendingVerifications() {
    return this.verificationService.listPendingCases();
  }

  async approveVerification(caseId: string, adminUserId: string, notes?: string) {
    return this.verificationService.approveCase(caseId, adminUserId, notes);
  }

  async rejectVerification(caseId: string, adminUserId: string, reason: string) {
    return this.verificationService.rejectCase(caseId, adminUserId, reason);
  }

  async listAllDisputes() {
    return this.disputeRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['evidence'],
    });
  }

  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, adminUserId: string) {
    return this.disputesService.resolve(disputeId, dto, adminUserId);
  }

  async listAllOrders() {
    return this.ordersService.findAll();
  }

  async listUsers() {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateUser(userId: string, patch: { role?: string; status?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }

    if (patch.role !== undefined) {
      if (!USER_ROLES.includes(patch.role)) {
        throw new BadRequestException({ error: { code: 'INVALID_ROLE', message: 'Invalid user role' } });
      }
      user.role = patch.role;
    }

    if (patch.status !== undefined) {
      if (!USER_STATUSES.includes(patch.status)) {
        throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid user status' } });
      }
      user.status = patch.status;
    }

    return this.userRepo.save(user);
  }

  async listOrgs() {
    return this.orgRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateOrgStatus(orgId: string, status: string) {
    if (!ORG_STATUSES.includes(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_ORG_STATUS', message: 'Invalid org status' } });
    }

    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException({ error: { code: 'ORG_NOT_FOUND', message: 'Organisation not found' } });
    }

    org.status = status;
    return this.orgRepo.save(org);
  }

  async listRefunds() {
    return this.refundRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateRefund(refundId: string, status: string, providerRefundId?: string) {
    if (!REFUND_STATUSES.includes(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_REFUND_STATUS', message: 'Invalid refund status' } });
    }

    const refund = await this.refundRepo.findOne({ where: { id: refundId } });
    if (!refund) {
      throw new NotFoundException({ error: { code: 'REFUND_NOT_FOUND', message: 'Refund not found' } });
    }

    refund.status = status;
    if (providerRefundId !== undefined) {
      refund.providerRefundId = providerRefundId;
    }

    return this.refundRepo.save(refund);
  }

  async holdOrder(orderId: string, reason?: string) {
    const order = await this.ordersService.findById(orderId);

    const existingHold = await this.holdRepo.findOne({ where: { orderId } });
    if (!existingHold) {
      await this.escrowService.createHold(orderId, order.orgId, Number(order.totalPaisa));
    }
    await this.escrowService.freezeHold(orderId);

    const currentStatus = order.status as OrderStatus;
    const canCancel = (ORDER_TRANSITIONS[currentStatus] ?? []).includes(OrderStatus.CANCELLED);
    if (canCancel) {
      await this.ordersService.advanceStatus(orderId, OrderStatus.CANCELLED);
    }

    return {
      ok: true,
      orderId,
      reason: reason ?? 'Manual risk hold by admin',
      orderStatus: canCancel ? OrderStatus.CANCELLED : order.status,
    };
  }

  async listRiskHolds() {
    const holds = await this.holdRepo.find({
      order: { createdAt: 'DESC' },
    });

    const orderIds = holds.map((h) => h.orderId);
    const orders = orderIds.length
      ? await this.orderRepo.find({ where: { id: In(orderIds) } })
      : [];

    const orderById = new Map(orders.map((o) => [o.id, o]));

    return holds.map((hold) => {
      const order = orderById.get(hold.orderId);
      return {
        id: hold.id,
        orderId: hold.orderId,
        orderRef: order?.orderRef ?? hold.orderId,
        reason: hold.status === 'dispute_frozen' ? 'Dispute/risk hold' : 'Escrow hold',
        status: hold.status,
        heldAt: hold.createdAt,
        releasedAt: hold.releasedAt,
      };
    });
  }

  async releaseRiskHold(orderId: string) {
    const hold = await this.escrowService.releaseHold(orderId);
    return {
      ok: true,
      orderId,
      status: hold.status,
      releasedAt: hold.releasedAt,
    };
  }
}

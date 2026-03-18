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
const DISPUTE_RESOLVED_STATUSES = ['resolved_seller', 'resolved_buyer', 'closed'];

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
    const [totalOrders, disputeCount, totalOrgs, pendingCases, recentOrders, activeUsers, blockedUsers, activeOrgs, pendingRefunds, heldHolds, releasedHolds] = await Promise.all([
      this.orderRepo.count(),
      this.disputeRepo.count({ where: { status: 'open' } }),
      this.orgRepo.count(),
      this.verificationService.listPendingCases(),
      this.orderRepo.find({
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.userRepo.count({ where: { status: 'active' } }),
      this.userRepo.count({ where: { status: 'blocked' } }),
      this.orgRepo.count({ where: { status: 'active' } }),
      this.refundRepo.count({ where: { status: 'pending' } }),
      this.holdRepo.count({ where: { status: 'held' } }),
      this.holdRepo.count({ where: { status: 'released' } }),
    ]);

    return {
      totalOrders,
      openDisputes: disputeCount,
      totalOrgs,
      pendingVerifications: pendingCases.length,
      recentOrders,
      activeUsers,
      blockedUsers,
      activeOrgs,
      pendingRefunds,
      heldHolds,
      releasedHolds,
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

  async listAllDisputes(filters?: { status?: string; search?: string }) {
    const query = this.disputeRepo.createQueryBuilder('dispute').leftJoinAndSelect('dispute.evidence', 'evidence');

    if (filters?.status) {
      query.andWhere('dispute.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(LOWER(dispute.reason) LIKE :search OR LOWER(dispute.orderId) LIKE :search OR LOWER(dispute.id) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    query.orderBy('dispute.createdAt', 'DESC');
    return query.getMany();
  }

  async resolveDispute(disputeId: string, dto: ResolveDisputeDto, adminUserId: string) {
    return this.disputesService.resolve(disputeId, dto, adminUserId);
  }

  async reopenDispute(disputeId: string) {
    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException({ error: { code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found' } });
    }
    if (!DISPUTE_RESOLVED_STATUSES.includes(dispute.status)) {
      throw new BadRequestException({ error: { code: 'DISPUTE_NOT_RESOLVED', message: 'Only resolved disputes can be reopened' } });
    }
    dispute.status = 'open';
    dispute.resolvedAt = null as unknown as Date;
    dispute.resolutionNotes = '';
    dispute.resolvedByUserId = null as unknown as string;
    return this.disputeRepo.save(dispute);
  }

  async listAllOrders(filters?: { status?: string; search?: string }) {
    const query = this.orderRepo.createQueryBuilder('order');
    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(LOWER(order.orderRef) LIKE :search OR LOWER(order.buyerName) LIKE :search OR LOWER(order.buyerPhone) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    query.orderBy('order.createdAt', 'DESC');
    return query.getMany();
  }

  async forceUpdateOrderStatus(orderId: string, status: string) {
    const normalizedStatus = status as OrderStatus;
    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(normalizedStatus)) {
      throw new BadRequestException({ error: { code: 'INVALID_ORDER_STATUS', message: 'Invalid order status' } });
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    }
    order.status = normalizedStatus;
    return this.orderRepo.save(order);
  }

  async listUsers(filters?: { search?: string; role?: string; status?: string }) {
    const query = this.userRepo.createQueryBuilder('user');
    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }
    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(LOWER(user.phoneE164) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.fullName) LIKE :search OR LOWER(user.id) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    query.orderBy('user.createdAt', 'DESC');
    return query.getMany();
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

  async bulkUpdateUsers(userIds: string[], patch: { role?: string; status?: string }) {
    if (!userIds?.length) {
      throw new BadRequestException({ error: { code: 'EMPTY_SELECTION', message: 'No users selected' } });
    }

    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    if (!users.length) {
      throw new NotFoundException({ error: { code: 'USERS_NOT_FOUND', message: 'No users found for given IDs' } });
    }

    if (patch.role !== undefined && !USER_ROLES.includes(patch.role)) {
      throw new BadRequestException({ error: { code: 'INVALID_ROLE', message: 'Invalid user role' } });
    }
    if (patch.status !== undefined && !USER_STATUSES.includes(patch.status)) {
      throw new BadRequestException({ error: { code: 'INVALID_STATUS', message: 'Invalid user status' } });
    }

    for (const user of users) {
      if (patch.role !== undefined) user.role = patch.role;
      if (patch.status !== undefined) user.status = patch.status;
    }
    await this.userRepo.save(users);

    return { ok: true, updatedCount: users.length };
  }

  async listOrgs(filters?: { search?: string; status?: string }) {
    const query = this.orgRepo.createQueryBuilder('org');
    if (filters?.status) {
      query.andWhere('org.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(LOWER(org.displayName) LIKE :search OR LOWER(org.slug) LIKE :search OR LOWER(org.supportEmail) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    query.orderBy('org.createdAt', 'DESC');
    return query.getMany();
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

  async bulkUpdateOrgStatus(orgIds: string[], status: string) {
    if (!orgIds?.length) {
      throw new BadRequestException({ error: { code: 'EMPTY_SELECTION', message: 'No organisations selected' } });
    }
    if (!ORG_STATUSES.includes(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_ORG_STATUS', message: 'Invalid org status' } });
    }

    const orgs = await this.orgRepo.find({ where: { id: In(orgIds) } });
    if (!orgs.length) {
      throw new NotFoundException({ error: { code: 'ORGS_NOT_FOUND', message: 'No organisations found for given IDs' } });
    }

    for (const org of orgs) org.status = status;
    await this.orgRepo.save(orgs);

    return { ok: true, updatedCount: orgs.length };
  }

  async listRefunds(filters?: { status?: string; search?: string; minAmountPaisa?: string }) {
    const query = this.refundRepo.createQueryBuilder('refund');
    if (filters?.status) {
      query.andWhere('refund.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(LOWER(refund.id) LIKE :search OR LOWER(refund.orderId) LIKE :search OR LOWER(refund.reason) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }
    if (filters?.minAmountPaisa) {
      const minAmount = Number(filters.minAmountPaisa);
      if (!Number.isNaN(minAmount)) {
        query.andWhere('refund.amountPaisa >= :minAmount', { minAmount });
      }
    }
    query.orderBy('refund.createdAt', 'DESC');
    return query.getMany();
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

  async bulkUpdateRefundStatus(refundIds: string[], status: string) {
    if (!refundIds?.length) {
      throw new BadRequestException({ error: { code: 'EMPTY_SELECTION', message: 'No refunds selected' } });
    }
    if (!REFUND_STATUSES.includes(status)) {
      throw new BadRequestException({ error: { code: 'INVALID_REFUND_STATUS', message: 'Invalid refund status' } });
    }

    const refunds = await this.refundRepo.find({ where: { id: In(refundIds) } });
    if (!refunds.length) {
      throw new NotFoundException({ error: { code: 'REFUNDS_NOT_FOUND', message: 'No refunds found for given IDs' } });
    }

    for (const refund of refunds) refund.status = status;
    await this.refundRepo.save(refunds);

    return { ok: true, updatedCount: refunds.length };
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

  private toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
    const escape = (value: string | number | null | undefined) => {
      const raw = value === null || value === undefined ? '' : String(value);
      const quoted = raw.replace(/"/g, '""');
      return `"${quoted}"`;
    };

    const lines = [headers.map(escape).join(',')];
    for (const row of rows) {
      lines.push(row.map(escape).join(','));
    }
    return lines.join('\n');
  }

  async exportUsersCsv(): Promise<string> {
    const users = await this.userRepo.find({ order: { createdAt: 'DESC' } });
    return this.toCsv(
      ['id', 'phoneE164', 'email', 'fullName', 'role', 'status', 'createdAt'],
      users.map((u) => [u.id, u.phoneE164, u.email, u.fullName, u.role, u.status, u.createdAt.toISOString()]),
    );
  }

  async exportOrgsCsv(): Promise<string> {
    const orgs = await this.orgRepo.find({ order: { createdAt: 'DESC' } });
    return this.toCsv(
      ['id', 'slug', 'displayName', 'status', 'supportPhone', 'supportEmail', 'createdAt'],
      orgs.map((o) => [o.id, o.slug, o.displayName, o.status, o.supportPhone, o.supportEmail, o.createdAt.toISOString()]),
    );
  }

  async exportOrdersCsv(): Promise<string> {
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });
    return this.toCsv(
      ['id', 'orderRef', 'buyerName', 'buyerPhone', 'status', 'totalPaisa', 'createdAt'],
      orders.map((o) => [o.id, o.orderRef, o.buyerName, o.buyerPhone, o.status, o.totalPaisa, o.createdAt.toISOString()]),
    );
  }

  async exportDisputesCsv(): Promise<string> {
    const disputes = await this.disputeRepo.find({ order: { createdAt: 'DESC' } });
    return this.toCsv(
      ['id', 'orderId', 'reason', 'status', 'resolvedAt', 'createdAt'],
      disputes.map((d) => [d.id, d.orderId, d.reason, d.status, d.resolvedAt ? d.resolvedAt.toISOString() : '', d.createdAt.toISOString()]),
    );
  }

  async exportRefundsCsv(): Promise<string> {
    const refunds = await this.refundRepo.find({ order: { createdAt: 'DESC' } });
    return this.toCsv(
      ['id', 'orderId', 'amountPaisa', 'reason', 'status', 'providerRefundId', 'createdAt'],
      refunds.map((r) => [r.id, r.orderId, r.amountPaisa, r.reason, r.status, r.providerRefundId, r.createdAt.toISOString()]),
    );
  }
}

import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User, UserStatus } from '../identity/entities/user.entity';
import { Org, OrgStatus, OrgVerifiedStatus } from '../orgs/entities/org.entity';
import {
  VerificationCase,
} from '../verification/entities/verification-case.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { PaymentIntent, PaymentIntentStatus } from '../payments/entities/payment-intent.entity';
import { VerificationService } from '../verification/verification.service';
import { DisputesService } from '../disputes/disputes.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Hard-coded admin user IDs for bootstrapping.
  // TODO: replace with role-based RBAC table once user roles are modelled in the DB.
  // Tracked in TRACK.md: admin role enforcement assumption.
  private readonly adminUserIds: Set<string> = new Set(
    (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean),
  );

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(VerificationCase)
    private readonly verificationCaseRepo: Repository<VerificationCase>,
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(PaymentIntent)
    private readonly paymentIntentRepo: Repository<PaymentIntent>,
    private readonly verificationService: VerificationService,
    private readonly disputesService: DisputesService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  private assertAdmin(userId: string): void {
    if (!this.adminUserIds.has(userId)) {
      throw new ForbiddenException({ error: { code: 'forbidden', message: 'Admin access required' } });
    }
  }

  async listVerificationCases(
    adminId: string,
    status?: string,
    _cursor?: string,
  ): Promise<{ items: VerificationCase[]; next_cursor: string | null }> {
    this.assertAdmin(adminId);

    const qb = this.verificationCaseRepo
      .createQueryBuilder('vc')
      .leftJoinAndSelect('vc.org', 'org')
      .orderBy('vc.created_at', 'ASC')
      .take(21);

    if (status) {
      qb.where('vc.status = :status', { status });
    }

    const items = await qb.getMany();
    const hasMore = items.length > 20;
    if (hasMore) items.pop();

    return {
      items,
      next_cursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async reviewVerificationCase(
    caseId: string,
    adminId: string,
    decision: 'approved' | 'rejected',
    notes: string,
  ): Promise<{ ok: boolean }> {
    this.assertAdmin(adminId);

    await this.verificationService.reviewCase(caseId, decision, adminId, notes);

    // Update org verified_status based on decision
    const verificationCase = await this.verificationCaseRepo.findOneOrFail({ where: { id: caseId } });
    const newVerifiedStatus =
      decision === 'approved' ? OrgVerifiedStatus.VERIFIED : OrgVerifiedStatus.REJECTED;

    await this.orgRepo.update({ id: verificationCase.orgId }, { verifiedStatus: newVerifiedStatus });

    await this.auditService.log({
      actorId: adminId,
      resourceType: 'verification_case',
      resourceId: caseId,
      eventType: `VERIFICATION_${decision.toUpperCase()}`,
      diff: { decision, notes },
    });

    return { ok: true };
  }

  async listDisputes(
    adminId: string,
    status?: string,
  ): Promise<{ items: Dispute[] }> {
    this.assertAdmin(adminId);

    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.evidence', 'evidence')
      .orderBy('d.created_at', 'ASC');

    if (status) {
      qb.where('d.status = :status', { status });
    }

    const items = await qb.getMany();
    return { items };
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    decision: 'refund' | 'no_refund',
    notes: string,
    refundAmountMinor?: number,
    idempotencyKey?: string,
  ): Promise<{ ok: boolean }> {
    this.assertAdmin(adminId);

    await this.disputesService.resolveDispute(
      disputeId,
      adminId,
      decision,
      notes,
      refundAmountMinor,
      idempotencyKey,
    );

    await this.auditService.log({
      actorId: adminId,
      resourceType: 'dispute',
      resourceId: disputeId,
      eventType: `DISPUTE_RESOLVED_${decision.toUpperCase()}`,
      diff: { decision, notes, refundAmountMinor },
    });

    return { ok: true };
  }

  async reviewRiskHold(
    intentId: string,
    adminId: string,
    decision: 'clear' | 'refund',
    notes?: string,
  ): Promise<{ ok: boolean }> {
    this.assertAdmin(adminId);

    const intent = await this.paymentIntentRepo.findOne({ where: { id: intentId } });
    if (!intent) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Payment intent not found' } });
    }

    if (decision === 'clear') {
      // Move to succeeded and process as normal payment
      await this.paymentIntentRepo.update({ id: intentId }, { status: PaymentIntentStatus.SUCCEEDED });
    } else {
      // Refund the payment
      await this.paymentIntentRepo.update({ id: intentId }, { status: PaymentIntentStatus.REFUNDED });
    }

    await this.auditService.log({
      actorId: adminId,
      resourceType: 'payment_intent',
      resourceId: intentId,
      eventType: `RISK_HOLD_${decision.toUpperCase()}`,
      diff: { decision, notes },
    });

    return { ok: true };
  }

  async listOrgs(
    adminId: string,
    status?: string,
  ): Promise<{ items: Org[] }> {
    this.assertAdmin(adminId);

    const qb = this.orgRepo.createQueryBuilder('org');
    if (status) {
      qb.where('org.status = :status', { status });
    }

    const items = await qb.getMany();
    return { items };
  }

  async updateOrgStatus(
    orgId: string,
    adminId: string,
    status: 'active' | 'suspended',
  ): Promise<{ ok: boolean }> {
    this.assertAdmin(adminId);

    const newStatus = status === 'active' ? OrgStatus.ACTIVE : OrgStatus.SUSPENDED;
    await this.orgRepo.update({ id: orgId }, { status: newStatus });

    await this.auditService.log({
      actorId: adminId,
      resourceType: 'org',
      resourceId: orgId,
      eventType: `ORG_STATUS_${status.toUpperCase()}`,
      diff: { status },
    });

    return { ok: true };
  }

  async updateUserStatus(
    userId: string,
    adminId: string,
    status: 'active' | 'blocked',
  ): Promise<{ ok: boolean }> {
    this.assertAdmin(adminId);

    const newStatus = status === 'active' ? UserStatus.ACTIVE : UserStatus.BLOCKED;
    await this.userRepo.update({ id: userId }, { status: newStatus });

    await this.auditService.log({
      actorId: adminId,
      resourceType: 'user',
      resourceId: userId,
      eventType: `USER_STATUS_${status.toUpperCase()}`,
      diff: { status },
    });

    return { ok: true };
  }
}

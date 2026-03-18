import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { Org } from '../orgs/entities/org.entity';
import { VerificationService } from '../verification/verification.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(Org) private orgRepo: Repository<Org>,
    private verificationService: VerificationService,
    private ordersService: OrdersService,
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
        relations: ['org'],
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

  async listAllOrders() {
    return this.ordersService.findAll();
  }

  async holdOrder(orderId: string) {
    return this.ordersService.advanceStatus(orderId, OrderStatus.CANCELLED);
  }
}

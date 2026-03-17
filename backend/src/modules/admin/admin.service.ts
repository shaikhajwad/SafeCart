import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Dispute } from '../disputes/entities/dispute.entity';
import { VerificationService } from '../verification/verification.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    private verificationService: VerificationService,
    private ordersService: OrdersService,
  ) {}

  async getDashboardStats() {
    const [totalOrders, paidOrders, disputeCount] = await Promise.all([
      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: OrderStatus.PAID } }),
      this.disputeRepo.count({ where: { status: 'open' } }),
    ]);

    return {
      totalOrders,
      paidOrders,
      openDisputes: disputeCount,
      timestamp: new Date(),
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

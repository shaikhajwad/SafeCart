import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    actorId?: string;
    resourceType: string;
    resourceId: string;
    eventType: string;
    ip?: string;
    userAgent?: string;
    diff?: Record<string, unknown>;
  }): Promise<void> {
    const entry = this.auditRepo.create({
      actorId: params.actorId || null,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      eventType: params.eventType,
      ip: params.ip || null,
      userAgent: params.userAgent || null,
      diff: params.diff || null,
    });
    await this.auditRepo.save(entry);
  }
}

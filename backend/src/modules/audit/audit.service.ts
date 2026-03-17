import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateAuditLogDto {
  actorUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  orgId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const entry = this.auditRepo.create(dto);
    return this.auditRepo.save(entry);
  }

  async list(filters: { orgId?: string; entityType?: string } = {}): Promise<AuditLog[]> {
    const qb = this.auditRepo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (filters.orgId) qb.andWhere('a.org_id = :orgId', { orgId: filters.orgId });
    if (filters.entityType) qb.andWhere('a.entity_type = :et', { et: filters.entityType });
    return qb.getMany();
  }

  async exportOrgCsv(orgId: string): Promise<string> {
    const logs = await this.list({ orgId });
    const header = 'id,action,entity_type,entity_id,actor_user_id,created_at\n';
    const rows = logs
      .map(
        (l) =>
          `${l.id},${l.action},${l.entityType ?? ''},${l.entityId ?? ''},${l.actorUserId ?? ''},${l.createdAt.toISOString()}`,
      )
      .join('\n');
    return header + rows;
  }
}

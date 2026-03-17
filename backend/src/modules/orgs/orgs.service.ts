import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Org } from './entities/org.entity';
import { OrgMember } from './entities/org-member.entity';
import { OrgCompliance } from './entities/org-compliance.entity';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Org) private orgRepo: Repository<Org>,
    @InjectRepository(OrgMember) private memberRepo: Repository<OrgMember>,
    @InjectRepository(OrgCompliance) private complianceRepo: Repository<OrgCompliance>,
  ) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateOrgDto, userId: string): Promise<Org> {
    const slug = dto.slug ?? this.slugify(dto.displayName);

    const existing = await this.orgRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException({ error: { code: 'SLUG_TAKEN', message: 'Org slug already in use' } });
    }

    const org = this.orgRepo.create({
      slug,
      displayName: dto.displayName,
      description: dto.description,
      supportPhone: dto.supportPhone,
      supportEmail: dto.supportEmail,
    });
    await this.orgRepo.save(org);

    // Create owner membership
    const member = this.memberRepo.create({
      orgId: org.id,
      userId,
      role: 'seller_owner',
      status: 'active',
    });
    await this.memberRepo.save(member);

    // Create empty compliance record
    const compliance = this.complianceRepo.create({ orgId: org.id });
    await this.complianceRepo.save(compliance);

    return org;
  }

  async findById(orgId: string): Promise<Org> {
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['members'],
    });
    if (!org) {
      throw new NotFoundException({ error: { code: 'ORG_NOT_FOUND', message: 'Organisation not found' } });
    }
    return org;
  }

  async update(orgId: string, dto: UpdateOrgDto, userId: string): Promise<Org> {
    await this.assertOwnerOrAdmin(orgId, userId);
    const org = await this.findById(orgId);
    Object.assign(org, dto);
    return this.orgRepo.save(org);
  }

  async getCompliance(orgId: string): Promise<OrgCompliance> {
    const compliance = await this.complianceRepo.findOne({ where: { orgId } });
    if (!compliance) {
      throw new NotFoundException({ error: { code: 'COMPLIANCE_NOT_FOUND', message: 'Compliance record not found' } });
    }
    return compliance;
  }

  async updateCompliance(orgId: string, data: Partial<OrgCompliance>, userId: string): Promise<OrgCompliance> {
    await this.assertOwnerOrAdmin(orgId, userId);
    let compliance = await this.complianceRepo.findOne({ where: { orgId } });
    if (!compliance) {
      compliance = this.complianceRepo.create({ orgId });
    }
    Object.assign(compliance, data);
    return this.complianceRepo.save(compliance);
  }

  async addMember(orgId: string, targetUserId: string, role: string, requesterId: string): Promise<OrgMember> {
    await this.assertOwnerOrAdmin(orgId, requesterId);
    const existing = await this.memberRepo.findOne({ where: { orgId, userId: targetUserId } });
    if (existing) {
      throw new ConflictException({ error: { code: 'ALREADY_MEMBER', message: 'User is already a member' } });
    }
    const member = this.memberRepo.create({ orgId, userId: targetUserId, role, status: 'invited' });
    return this.memberRepo.save(member);
  }

  async listMembers(orgId: string): Promise<OrgMember[]> {
    return this.memberRepo.find({ where: { orgId } });
  }

  private async assertOwnerOrAdmin(orgId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({ where: { orgId, userId } });
    if (!member || (member.role !== 'seller_owner' && member.role !== 'admin')) {
      // Check if user has platform admin role via a different mechanism if needed
      if (!member) {
        throw new ForbiddenException({ error: { code: 'FORBIDDEN', message: 'Not a member of this org' } });
      }
    }
  }
}

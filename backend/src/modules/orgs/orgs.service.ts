import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Org, OrgStatus, OrgVerifiedStatus } from './entities/org.entity';
import { OrgMember, OrgMemberRole } from './entities/org-member.entity';
import { OrgComplianceProfile } from './entities/org-compliance-profile.entity';
import { CreateOrgDto, UpdateOrgDto, UpdateComplianceDto } from './dto/orgs.dto';

@Injectable()
export class OrgsService {
  constructor(
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    @InjectRepository(OrgMember)
    private readonly orgMemberRepo: Repository<OrgMember>,
    @InjectRepository(OrgComplianceProfile)
    private readonly complianceRepo: Repository<OrgComplianceProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async createOrg(userId: string, dto: CreateOrgDto): Promise<{ org_id: string; verified_status: string }> {
    const existing = await this.orgRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({ error: { code: 'slug_taken', message: 'Slug already taken' } });
    }

    return await this.dataSource.transaction(async (manager) => {
      const org = manager.create(Org, {
        name: dto.name,
        slug: dto.slug,
        status: OrgStatus.ACTIVE,
        verifiedStatus: OrgVerifiedStatus.UNVERIFIED,
        supportPhone: dto.support_phone || null,
        supportEmail: dto.support_email || null,
      });
      await manager.save(org);

      const member = manager.create(OrgMember, {
        orgId: org.id,
        userId,
        role: OrgMemberRole.OWNER,
      });
      await manager.save(member);

      // Create empty compliance profile
      const compliance = manager.create(OrgComplianceProfile, { orgId: org.id });
      await manager.save(compliance);

      return { org_id: org.id, verified_status: org.verifiedStatus };
    });
  }

  async getOrg(orgId: string, userId: string): Promise<Org> {
    await this.assertMember(orgId, userId);
    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      relations: ['complianceProfile'],
    });
    if (!org) throw new NotFoundException({ error: { code: 'not_found', message: 'Org not found' } });
    return org;
  }

  async updateOrg(orgId: string, userId: string, dto: UpdateOrgDto): Promise<Org> {
    await this.assertMember(orgId, userId);
    const org = await this.orgRepo.findOneOrFail({ where: { id: orgId } });

    if (dto.name !== undefined) org.name = dto.name;
    if (dto.support_phone !== undefined) org.supportPhone = dto.support_phone;
    if (dto.support_email !== undefined) org.supportEmail = dto.support_email;
    if (dto.return_policy !== undefined) org.returnPolicy = dto.return_policy;

    return this.orgRepo.save(org);
  }

  async updateCompliance(orgId: string, userId: string, dto: UpdateComplianceDto): Promise<{ ok: boolean }> {
    await this.assertOwner(orgId, userId);

    let profile = await this.complianceRepo.findOne({ where: { orgId } });
    if (!profile) {
      profile = this.complianceRepo.create({ orgId });
    }

    if (dto.trade_license_no !== undefined) profile.tradeLicenseNo = dto.trade_license_no;
    if (dto.vat_reg_no !== undefined) profile.vatRegNo = dto.vat_reg_no;
    if (dto.tin_no !== undefined) profile.tinNo = dto.tin_no;
    if (dto.ubid !== undefined) profile.ubid = dto.ubid;
    if (dto.pra_no !== undefined) profile.praNo = dto.pra_no;
    if (dto.business_address !== undefined) profile.businessAddress = dto.business_address;

    await this.complianceRepo.save(profile);
    return { ok: true };
  }

  async assertMember(orgId: string, userId: string): Promise<OrgMember> {
    const member = await this.orgMemberRepo.findOne({
      where: { orgId, userId },
    });
    if (!member) {
      throw new ForbiddenException({ error: { code: 'forbidden', message: 'Not a member of this org' } });
    }
    return member;
  }

  async assertOwner(orgId: string, userId: string): Promise<OrgMember> {
    const member = await this.assertMember(orgId, userId);
    if (member.role !== OrgMemberRole.OWNER) {
      throw new ForbiddenException({ error: { code: 'forbidden', message: 'Only org owner can perform this action' } });
    }
    return member;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationCase, VerificationStatus } from './entities/verification-case.entity';
import { VerificationDocument } from './entities/verification-document.entity';
import { OrgsService } from '../orgs/orgs.service';

export interface SubmitVerificationDto {
  documents: Array<{ doc_type: string; object_key: string; mime_type?: string; sha256?: string }>;
}

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCase)
    private readonly caseRepo: Repository<VerificationCase>,
    @InjectRepository(VerificationDocument)
    private readonly docRepo: Repository<VerificationDocument>,
    private readonly orgsService: OrgsService,
  ) {}

  async submitCase(
    orgId: string,
    userId: string,
    dto: SubmitVerificationDto,
  ): Promise<{ case_id: string; status: string }> {
    await this.orgsService.assertOwner(orgId, userId);

    const verificationCase = this.caseRepo.create({
      orgId,
      submittedBy: userId,
      status: VerificationStatus.PENDING,
    });
    await this.caseRepo.save(verificationCase);

    // Create document records
    const docs = dto.documents.map((d) =>
      this.docRepo.create({
        caseId: verificationCase.id,
        docType: d.doc_type,
        objectKey: d.object_key,
        mimeType: d.mime_type || 'application/octet-stream',
        sha256: d.sha256 || '',
      }),
    );
    await this.docRepo.save(docs);

    return { case_id: verificationCase.id, status: verificationCase.status };
  }

  async getStatus(orgId: string, userId: string): Promise<{ verified_status: string; latest_case_id: string | null }> {
    await this.orgsService.assertMember(orgId, userId);

    const latestCase = await this.caseRepo.findOne({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });

    // Get org verified_status from orgs service
    const org = await this.orgsService.getOrg(orgId, userId);

    return {
      verified_status: org.verifiedStatus,
      latest_case_id: latestCase?.id ?? null,
    };
  }

  async reviewCase(
    caseId: string,
    decision: 'approved' | 'rejected',
    reviewerId: string,
    notes: string,
  ): Promise<void> {
    const verificationCase = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!verificationCase) {
      throw new NotFoundException({ error: { code: 'not_found', message: 'Verification case not found' } });
    }

    verificationCase.status =
      decision === 'approved' ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;
    verificationCase.reviewedBy = reviewerId;
    verificationCase.reviewNotes = notes;
    await this.caseRepo.save(verificationCase);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationCase } from './entities/verification-case.entity';
import { VerificationDocument } from './entities/verification-document.entity';
import { SubmitVerificationDto } from './dto/submit-verification.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCase)
    private caseRepo: Repository<VerificationCase>,
    @InjectRepository(VerificationDocument)
    private docRepo: Repository<VerificationDocument>,
  ) {}

  async submitCase(orgId: string, userId: string): Promise<VerificationCase> {
    // Check for existing pending case
    let existing = await this.caseRepo.findOne({
      where: { orgId, status: 'pending' },
    });
    if (!existing) {
      existing = await this.caseRepo.findOne({
        where: { orgId, status: 'under_review' },
      });
    }
    if (existing) return existing;

    const verificationCase = this.caseRepo.create({
      orgId,
      submittedByUserId: userId,
      status: 'pending',
    });
    return this.caseRepo.save(verificationCase);
  }

  async getCurrentCase(orgId: string): Promise<VerificationCase | null> {
    return this.caseRepo.findOne({
      where: { orgId },
      order: { createdAt: 'DESC' },
      relations: ['documents'],
    });
  }

  async addDocument(
    orgId: string,
    userId: string,
    dto: SubmitVerificationDto,
  ): Promise<VerificationDocument> {
    let verificationCase = await this.caseRepo.findOne({
      where: { orgId, status: 'pending' },
    });

    if (!verificationCase) {
      verificationCase = this.caseRepo.create({
        orgId,
        submittedByUserId: userId,
        status: 'pending',
      });
      await this.caseRepo.save(verificationCase);
    }

    const doc = this.docRepo.create({
      caseId: verificationCase.id,
      documentType: dto.documentType,
      fileKey: dto.fileKey,
      originalName: dto.originalName,
      contentType: dto.contentType,
    });
    return this.docRepo.save(doc);
  }

  async approveCase(caseId: string, reviewerUserId: string, notes?: string): Promise<VerificationCase> {
    const verificationCase = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!verificationCase) {
      throw new NotFoundException({ error: { code: 'CASE_NOT_FOUND', message: 'Verification case not found' } });
    }
    verificationCase.status = 'approved';
    verificationCase.reviewerUserId = reviewerUserId;
    verificationCase.reviewerNotes = notes ?? '';
    return this.caseRepo.save(verificationCase);
  }

  async rejectCase(caseId: string, reviewerUserId: string, reason: string): Promise<VerificationCase> {
    const verificationCase = await this.caseRepo.findOne({ where: { id: caseId } });
    if (!verificationCase) {
      throw new NotFoundException({ error: { code: 'CASE_NOT_FOUND', message: 'Verification case not found' } });
    }
    verificationCase.status = 'rejected';
    verificationCase.reviewerUserId = reviewerUserId;
    verificationCase.rejectionReason = reason;
    return this.caseRepo.save(verificationCase);
  }

  async listPendingCases(): Promise<VerificationCase[]> {
    return this.caseRepo.find({
      where: [{ status: 'pending' }, { status: 'under_review' }],
      order: { createdAt: 'ASC' },
      relations: ['documents'],
    });
  }
}

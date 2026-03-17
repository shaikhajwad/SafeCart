import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { VerificationCase } from './entities/verification-case.entity';
import { VerificationDocument } from './entities/verification-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCase, VerificationDocument])],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}

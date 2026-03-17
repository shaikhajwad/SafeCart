import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCase } from './entities/verification-case.entity';
import { VerificationDocument } from './entities/verification-document.entity';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { OrgsModule } from '../orgs/orgs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCase, VerificationDocument]),
    OrgsModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService, TypeOrmModule],
})
export class VerificationModule {}

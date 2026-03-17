import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Org } from './entities/org.entity';
import { OrgMember } from './entities/org-member.entity';
import { OrgComplianceProfile } from './entities/org-compliance-profile.entity';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Org, OrgMember, OrgComplianceProfile])],
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService, TypeOrmModule],
})
export class OrgsModule {}

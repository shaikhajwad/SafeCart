import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgsController } from './orgs.controller';
import { OrgsService } from './orgs.service';
import { Org } from './entities/org.entity';
import { OrgMember } from './entities/org-member.entity';
import { OrgCompliance } from './entities/org-compliance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Org, OrgMember, OrgCompliance])],
  controllers: [OrgsController],
  providers: [OrgsService],
  exports: [OrgsService],
})
export class OrgsModule {}

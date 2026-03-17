import {
  Controller,
  Get,
  Param,
  UseGuards,
  Res,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('audit-logs')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'List audit logs (admin)' })
  list(@Query('entityType') entityType?: string) {
    return this.auditService.list({ entityType });
  }

  @Get('orgs/:id/export')
  @ApiOperation({ summary: 'CSV export of org audit log (seller)' })
  async exportCsv(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.auditService.exportOrgCsv(id);
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="audit-${id}.csv"`);
    res.send(csv);
  }
}

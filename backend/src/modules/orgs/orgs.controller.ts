import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrgsService } from './orgs.service';
import { CreateOrgDto, UpdateOrgDto, UpdateComplianceDto } from './dto/orgs.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('orgs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create organization' })
  async createOrg(@Body() dto: CreateOrgDto, @CurrentUser() user: AuthUser) {
    return this.orgsService.createOrg(user.id, dto);
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organization profile' })
  async getOrg(@Param('orgId') orgId: string, @CurrentUser() user: AuthUser) {
    return this.orgsService.getOrg(orgId, user.id);
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organization settings' })
  async updateOrg(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrgDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orgsService.updateOrg(orgId, user.id, dto);
  }

  @Put(':orgId/compliance')
  @ApiOperation({ summary: 'Update compliance IDs' })
  async updateCompliance(
    @Param('orgId') orgId: string,
    @Body() dto: UpdateComplianceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orgsService.updateCompliance(orgId, user.id, dto);
  }
}

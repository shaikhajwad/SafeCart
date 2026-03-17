import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('orgs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organisation' })
  create(@Body() dto: CreateOrgDto, @CurrentUser() user: AuthUser) {
    return this.orgsService.create(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get org profile' })
  findOne(@Param('id') id: string) {
    return this.orgsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update org profile' })
  update(@Param('id') id: string, @Body() dto: UpdateOrgDto, @CurrentUser() user: AuthUser) {
    return this.orgsService.update(id, dto, user.id);
  }

  @Get(':id/compliance')
  @ApiOperation({ summary: 'Get org compliance profile' })
  getCompliance(@Param('id') id: string) {
    return this.orgsService.getCompliance(id);
  }

  @Put(':id/compliance')
  @ApiOperation({ summary: 'Update org compliance profile' })
  updateCompliance(
    @Param('id') id: string,
    @Body() data: Record<string, string>,
    @CurrentUser() user: AuthUser,
  ) {
    return this.orgsService.updateCompliance(id, data, user.id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a member to the org' })
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.orgsService.addMember(id, body.userId, body.role, user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List org members' })
  listMembers(@Param('id') id: string) {
    return this.orgsService.listMembers(id);
  }
}

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService, SubmitVerificationDto } from './verification.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/orgs/:orgId/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('cases')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit verification case (KYC)' })
  async submitCase(
    @Param('orgId') orgId: string,
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.verificationService.submitCase(orgId, user.id, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get verification status' })
  async getStatus(@Param('orgId') orgId: string, @CurrentUser() user: AuthUser) {
    return this.verificationService.getStatus(orgId, user.id);
  }
}

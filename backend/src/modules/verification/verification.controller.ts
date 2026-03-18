import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/orgs/:orgId/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit KYC case for an organisation' })
  submitCase(@Param('orgId') orgId: string, @CurrentUser() user: AuthUser) {
    return this.verificationService.submitCase(orgId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current verification status' })
  getStatus(@Param('orgId') orgId: string) {
    return this.verificationService.getCurrentCase(orgId);
  }

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a document to the verification case' })
  addDocument(
    @Param('orgId') orgId: string,
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.verificationService.addDocument(orgId, user.id, dto);
  }
}

import { IsString, IsOptional, Matches, MaxLength, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrgDto {
  @ApiProperty({ example: 'Nila Boutique' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'nila-boutique' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'support_phone must be a valid E.164 phone number' })
  support_phone?: string;

  @ApiPropertyOptional({ example: 'support@nilaboutique.com' })
  @IsOptional()
  @IsEmail()
  support_email?: string;
}

export class UpdateOrgDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  support_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  support_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  return_policy?: string;
}

export class UpdateComplianceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trade_license_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vat_reg_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tin_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ubid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pra_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  business_address?: string;
}

import { PartialType } from '@nestjs/swagger';
import { CreateOrgDto } from './create-org.dto';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrgDto extends PartialType(CreateOrgDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true })
  websiteUrl?: string;

  @ApiProperty({ required: false, description: 'Alias of displayName' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: 'Alias of supportPhone' })
  @IsOptional()
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'Support phone must be a valid BD E.164 number' })
  contactPhone?: string;

  @ApiProperty({ required: false, description: 'Alias of websiteUrl' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true })
  website?: string;
}

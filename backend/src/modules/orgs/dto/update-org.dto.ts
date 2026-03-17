import { PartialType } from '@nestjs/swagger';
import { CreateOrgDto } from './create-org.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrgDto extends PartialType(CreateOrgDto) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  websiteUrl?: string;
}

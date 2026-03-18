import { IsString, IsOptional, IsUrl, Matches, MinLength, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrgDto {
  @ApiPropertyOptional({ example: 'My Shop BD' })
  @ValidateIf((o: CreateOrgDto) => !o.name)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ example: 'My Shop BD', description: 'Alias of displayName' })
  @ValidateIf((o: CreateOrgDto) => !o.displayName)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'my-shop-bd', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  @MinLength(3)
  @MaxLength(60)
  slug?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'Support phone must be a valid BD E.164 number' })
  supportPhone?: string;

  @ApiPropertyOptional({ required: false, description: 'Alias of supportPhone' })
  @IsOptional()
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'Support phone must be a valid BD E.164 number' })
  contactPhone?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  supportEmail?: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true })
  websiteUrl?: string;

  @ApiPropertyOptional({ required: false, description: 'Alias of websiteUrl' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true })
  website?: string;
}

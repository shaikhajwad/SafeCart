import { IsString, IsOptional, IsUrl, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrgDto {
  @ApiProperty({ example: 'My Shop BD' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ example: 'my-shop-bd', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  @MinLength(3)
  @MaxLength(60)
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'Support phone must be a valid BD E.164 number' })
  supportPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supportEmail?: string;
}

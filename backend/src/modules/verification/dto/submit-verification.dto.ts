import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVerificationDto {
  @ApiProperty({ example: 'trade_license' })
  @IsString()
  documentType: string;

  @ApiProperty({ example: 'documents/trade-license.pdf' })
  @IsString()
  fileKey: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contentType?: string;
}

import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveDisputeDto {
  @ApiProperty({ enum: ['resolved_seller', 'resolved_buyer', 'closed'] })
  @IsString()
  @IsIn(['resolved_seller', 'resolved_buyer', 'closed'])
  resolution: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

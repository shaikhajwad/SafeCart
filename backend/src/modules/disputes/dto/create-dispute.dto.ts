import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDisputeDto {
  @ApiProperty({ example: 'Item not as described' })
  @IsString()
  @MaxLength(1000)
  reason: string;
}

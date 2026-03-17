import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ enum: ['sslcommerz', 'bkash'] })
  @IsString()
  @IsIn(['sslcommerz', 'bkash'])
  provider: string;
}

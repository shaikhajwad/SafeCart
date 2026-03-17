import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+8801712345678', description: 'E.164 Bangladesh phone number' })
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'phone must be a valid Bangladesh E.164 number' })
  phone: string;
}

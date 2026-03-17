import { IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'phone must be a valid Bangladesh E.164 number' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}

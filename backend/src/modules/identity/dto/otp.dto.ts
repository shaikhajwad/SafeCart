import { IsString, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OtpPurpose {
  LOGIN = 'login',
  REGISTER = 'register',
}

export class SendOtpDto {
  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_e164 must be a valid E.164 phone number' })
  phone_e164: string;

  @ApiProperty({ enum: OtpPurpose, default: OtpPurpose.LOGIN })
  @IsEnum(OtpPurpose)
  @IsOptional()
  purpose?: OtpPurpose = OtpPurpose.LOGIN;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone_e164 must be a valid E.164 phone number' })
  phone_e164: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit number' })
  otp: string;
}

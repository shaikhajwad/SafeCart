import {
  IsString,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  @Matches(/^\+8801[3-9]\d{8}$/, { message: 'phone must be a valid Bangladesh E.164 number' })
  buyerPhone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  buyerName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  addressLine1: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Gulshan' })
  @IsString()
  thana: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialInstructions?: string;
}

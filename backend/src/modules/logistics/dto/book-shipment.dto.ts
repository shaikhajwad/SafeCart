import { IsString, IsIn, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BookShipmentDto {
  @ApiProperty({ enum: ['pathao', 'paperfly', 'redx', 'ecourier'] })
  @IsString()
  @IsIn(['pathao', 'paperfly', 'redx', 'ecourier'])
  provider: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  chargePaisa?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  serviceType?: string;
}

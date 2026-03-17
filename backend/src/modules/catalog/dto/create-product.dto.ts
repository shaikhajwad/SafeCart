import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Handmade Kantha Stitch Saree' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000, description: 'Price in paisa (1 BDT = 100 paisa)' })
  @IsNumber()
  @IsPositive()
  basePricePaisa: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: 'Weight in grams' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  weightGrams?: number;
}

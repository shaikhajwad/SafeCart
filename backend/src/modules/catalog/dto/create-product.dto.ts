import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Handmade Kantha Stitch Saree' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Price in paisa (1 BDT = 100 paisa)' })
  @ValidateIf((o: CreateProductDto) => o.pricePaisa === undefined)
  @IsNumber()
  @IsPositive()
  basePricePaisa?: number;

  @ApiPropertyOptional({ example: 150000, description: 'Alias of basePricePaisa' })
  @ValidateIf((o: CreateProductDto) => o.basePricePaisa === undefined)
  @IsNumber()
  @IsPositive()
  pricePaisa?: number;

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

  @ApiPropertyOptional({ required: false, description: 'Optional UI inventory field; currently not persisted on product' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}

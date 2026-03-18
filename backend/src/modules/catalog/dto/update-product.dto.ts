import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ required: false, enum: ['active', 'archived', 'draft'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Alias of basePricePaisa' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePaisa?: number;

  @ApiProperty({ required: false, description: 'Optional UI inventory field; currently not persisted on product' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}

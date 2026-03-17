import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('api/orgs/:orgId/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product' })
  create(@Param('orgId') orgId: string, @Body() dto: CreateProductDto) {
    return this.catalogService.create(orgId, dto);
  }

  @Get('api/orgs/:orgId/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List products for an org' })
  findByOrg(@Param('orgId') orgId: string) {
    return this.catalogService.findByOrg(orgId);
  }

  @Get('api/products/:id')
  @ApiOperation({ summary: 'Get a product (public)' })
  findOne(@Param('id') id: string) {
    return this.catalogService.findById(id);
  }

  @Patch('api/products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Param('orgId') orgId: string,
  ) {
    return this.catalogService.update(id, dto, orgId ?? '');
  }

  @Delete('api/products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a product' })
  archive(@Param('id') id: string, @Param('orgId') orgId: string) {
    return this.catalogService.archive(id, orgId ?? '');
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CatalogService, CreateProductDto, UpdateProductDto } from './catalog.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/orgs/:orgId/products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product' })
  async createProduct(
    @Param('orgId') orgId: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogService.createProduct(orgId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List products' })
  async listProducts(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthUser,
    @Query('cursor') cursor?: string,
  ) {
    return this.catalogService.listProducts(orgId, user.id, cursor);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @Param('orgId') orgId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.catalogService.updateProduct(orgId, productId, user.id, dto);
  }
}

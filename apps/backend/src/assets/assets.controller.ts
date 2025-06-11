import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DevAuthGuard } from '../auth/guards/dev-auth.guard';
import { AssetsService } from './assets.service';
import { Asset } from './entities/asset.entity';

@ApiTags('Assets')
@Controller('assets')
// @UseGuards(DevAuthGuard) // Temporarily disabled for development
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all assets' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  async findAll(): Promise<Asset[]> {
    return this.assetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(@Param('id') id: string): Promise<Asset> {
    const asset = await this.assetsService.findById(id);
    if (!asset) {
      throw new Error('Asset not found');
    }
    return asset;
  }

  @Post()
  @ApiOperation({ summary: 'Create new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  async create(@Body() createAssetData: Partial<Asset>): Promise<Asset> {
    return this.assetsService.create(createAssetData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update asset' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(@Param('id') id: string, @Body() updateData: Partial<Asset>): Promise<Asset> {
    return this.assetsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset' })
  @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.assetsService.delete(id);
  }

  @Post('seed/sample-data')
  @ApiOperation({ summary: 'Seed sample assets for development' })
  @ApiResponse({ status: 201, description: 'Sample assets created successfully' })
  async seedSampleAssets() {
    return this.assetsService.seedSampleAssets();
  }
} 
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegionsService } from './regions.service';  // ✅ TAMBAHKAN INI
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProvinceDto, UpdateProvinceDto } from './dto/province.dto';
import { CreateRegencyDto, UpdateRegencyDto } from './dto/regency.dto';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';
import { CreateVillageDto, UpdateVillageDto } from './dto/village.dto';

@Controller('regions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegionsController {
  constructor(private regionsService: RegionsService) {}

  // ==================== PROVINCE ====================

  @Get('provinces')
  @SkipRegionScope()
  async findAllProvinces() {
    return this.regionsService.findAllProvinces();
  }

  @Get('provinces/:id')
  @SkipRegionScope()
  async findProvinceById(@Param('id') id: string) {
    return this.regionsService.findProvinceById(id);
  }

  @Post('provinces')
  @Roles('SUPER_ADMIN')
  async createProvince(@Body() data: CreateProvinceDto) {
    return this.regionsService.createProvince(data);
  }

  @Put('provinces/:id')
  @Roles('SUPER_ADMIN')
  async updateProvince(
    @Param('id') id: string,
    @Body() data: UpdateProvinceDto,
  ) {
    return this.regionsService.updateProvince(id, data);
  }

  @Delete('provinces/:id')
  @Roles('SUPER_ADMIN')
  async deleteProvince(@Param('id') id: string) {
    return this.regionsService.deleteProvince(id);
  }

  // ==================== REGENCY ====================

  @Get('regencies')
  @SkipRegionScope()
  async findAllRegencies(@Query('provinceId') provinceId?: string) {
    return this.regionsService.findAllRegencies(provinceId);
  }

  @Get('regencies/:id')
  @SkipRegionScope()
  async findRegencyById(@Param('id') id: string) {
    return this.regionsService.findRegencyById(id);
  }

  @Post('regencies')
  @Roles('SUPER_ADMIN')
  async createRegency(@Body() data: CreateRegencyDto) {
    return this.regionsService.createRegency(data);
  }

  @Put('regencies/:id')
  @Roles('SUPER_ADMIN')
  async updateRegency(
    @Param('id') id: string,
    @Body() data: UpdateRegencyDto,
  ) {
    return this.regionsService.updateRegency(id, data);
  }

  @Delete('regencies/:id')
  @Roles('SUPER_ADMIN')
  async deleteRegency(@Param('id') id: string) {
    return this.regionsService.deleteRegency(id);
  }

  // ==================== DISTRICT ====================

  @Get('districts')
  @SkipRegionScope()
  async findAllDistricts(@Query('regencyId') regencyId?: string) {
    return this.regionsService.findAllDistricts(regencyId);
  }

  @Get('districts/:id')
  @SkipRegionScope()
  async findDistrictById(@Param('id') id: string) {
    return this.regionsService.findDistrictById(id);
  }

  @Post('districts')
  @Roles('SUPER_ADMIN')
  async createDistrict(@Body() data: CreateDistrictDto) {
    return this.regionsService.createDistrict(data);
  }

  @Put('districts/:id')
  @Roles('SUPER_ADMIN')
  async updateDistrict(
    @Param('id') id: string,
    @Body() data: UpdateDistrictDto,
  ) {
    return this.regionsService.updateDistrict(id, data);
  }

  @Delete('districts/:id')
  @Roles('SUPER_ADMIN')
  async deleteDistrict(@Param('id') id: string) {
    return this.regionsService.deleteDistrict(id);
  }

  // ==================== VILLAGE ====================

  @Get('villages')
  @SkipRegionScope()
  async findAllVillages(@Query('districtId') districtId?: string) {
    return this.regionsService.findAllVillages(districtId);
  }

  @Get('villages/:id')
  @SkipRegionScope()
  async findVillageById(@Param('id') id: string) {
    return this.regionsService.findVillageById(id);
  }

  @Post('villages')
  @Roles('SUPER_ADMIN')
  async createVillage(@Body() data: CreateVillageDto) {
    return this.regionsService.createVillage(data);
  }

  @Put('villages/:id')
  @Roles('SUPER_ADMIN')
  async updateVillage(
    @Param('id') id: string,
    @Body() data: UpdateVillageDto,
  ) {
    return this.regionsService.updateVillage(id, data);
  }

  @Delete('villages/:id')
  @Roles('SUPER_ADMIN')
  async deleteVillage(@Param('id') id: string) {
    return this.regionsService.deleteVillage(id);
  }

    // ==================== RW & RT ====================

  @Get('rws')
  @SkipRegionScope()
  async findAllRws() {
    return this.regionsService.findAllRws();
  }

  @Get('rts')
  @SkipRegionScope()
  async findAllRts(@Query('rwId') rwId?: string) {
    return this.regionsService.findAllRts(rwId);
  }
}
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
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RegionScopeGuard } from '../../common/guards/region-scope.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';
import { CreateServiceRequestDto, UpdateServiceRequestStatusDto } from './dto/service-request.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard, RegionScopeGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) { }

  // ==================== STATS ====================

  @Get('stats')
  @SkipRegionScope()
  async getStats(@Request() req) {
    return this.servicesService.getStats(req.user);
  }

  // ==================== SERVICE TYPES ====================

  @Get('types/public')
  @SkipRegionScope()
  async getPublicTypes(@Query('villageId') villageId: string) {
    return this.servicesService.findAllTypes(villageId);
  }

  @Get('types')
  @SkipRegionScope()
  async findAllTypes(
    @Query('villageId') villageId?: string,
    @Request() req?: any,
  ) {
    // Village Admin: paksa villageId = desa sendiri
    if (req?.user && req.user.role === 'VILLAGE_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.servicesService.findAllTypes(villageId);
  }

  @Get('types/:id')
  @SkipRegionScope()
  async findOneType(@Param('id') id: string) {
    return this.servicesService.findOneType(id);
  }

  @Post('types')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async createType(@Body() data: CreateServiceTypeDto, @Request() req) {
    return this.servicesService.createType(data, req.user);
  }

  @Put('types/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async updateType(
    @Param('id') id: string,
    @Body() data: UpdateServiceTypeDto,
    @Request() req,
  ) {
    return this.servicesService.updateType(id, data, req.user);
  }

  @Delete('types/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async deleteType(@Param('id') id: string, @Request() req) {
    return this.servicesService.deleteType(id, req.user);
  }

  // ==================== SERVICE REQUESTS ====================

  @Get('requests')
  @SkipRegionScope()
  async findAllRequests(
    @Query('status') status?: string,
    @Query('villageId') villageId?: string,
    @Request() req?: any,
  ) {
    return this.servicesService.findAllRequests(req.user, { status, villageId });
  }

  @Get('requests/:id')
  @SkipRegionScope()
  async findOneRequest(@Param('id') id: string, @Request() req) {
    return this.servicesService.findOneRequest(id, req.user);
  }

  @Post('requests')
  @SkipRegionScope()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: join(__dirname, '..', '..', '..', 'uploads', 'attachments'),
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|pdf|doc|docx)$/i;
        if (!allowed.test(extname(file.originalname))) {
          return cb(new Error('Hanya file gambar, PDF, atau Word yang diizinkan'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
    }),
  )
  async createRequest(
    @Body() data: CreateServiceRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    // Build attachment objects from uploaded files
    const attachments = (files || []).map((file) => ({
      name: file.originalname,
      url: `/uploads/attachments/${file.filename}`,
      type: file.mimetype,
      size: file.size,
    }));

    return this.servicesService.createRequest({ ...data, attachments }, req.user);
  }

  @Put('requests/:id/status')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN', 'RT_ADMIN', 'RW_ADMIN')
  @SkipRegionScope()
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() data: UpdateServiceRequestStatusDto,
    @Request() req,
  ) {
    return this.servicesService.updateRequestStatus(id, data, req.user);
  }

  @Delete('requests/:id')
  @SkipRegionScope()
  async deleteRequest(@Param('id') id: string, @Request() req) {
    return this.servicesService.deleteRequest(id, req.user);
  }
}
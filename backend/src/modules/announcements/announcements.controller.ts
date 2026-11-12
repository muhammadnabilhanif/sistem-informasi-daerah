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
  Request,
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  // ==================== PUBLIC ====================

  @Get('public')
  @SkipRegionScope() // ✅ Public endpoint
  async getPublicAnnouncements(@Query('villageId') villageId: string) {
    return this.announcementsService.findPublic(villageId);
  }

  // ==================== LIST & DETAIL ====================

  @Get()
  @SkipRegionScope() // ✅ Controller paksa scope, jadi skip guard
  async findAll(
    @Query('villageId') villageId?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    // ✅ Village Admin & Citizen: paksa villageId = desa sendiri
    if (req?.user && req.user.role !== 'SUPER_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.announcementsService.findAll(villageId, status);
  }

  @Get(':id')
  @SkipRegionScope() // ✅ Service cek ownership via user
  async findOne(@Param('id') id: string, @Request() req?: any) {
    return this.announcementsService.findOne(id, req?.user);
  }

  // ==================== CRUD (Admin) ====================

  @Post()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Service paksa villageId
  async create(@Body() data: CreateAnnouncementDto, @Request() req) {
    if (req.user.role === 'VILLAGE_ADMIN') {
      data.villageId = req.user.villageId;
    }
    return this.announcementsService.create(data, req.user.id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Service cek ownership
  async update(
    @Param('id') id: string,
    @Body() data: UpdateAnnouncementDto,
    @Request() req,
  ) {
    return this.announcementsService.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Service cek ownership
  async delete(@Param('id') id: string, @Request() req) {
    return this.announcementsService.delete(id, req.user);
  }

  @Post(':id/publish')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Service cek ownership
  async publish(@Param('id') id: string, @Request() req) {
    return this.announcementsService.publish(id, req.user);
  }
}
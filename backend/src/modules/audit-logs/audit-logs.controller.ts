import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAuditLogDto } from './dto/audit-log.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get('summary')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Skip karena kita paksa villageId di bawah
  async getSummary(
    @Query('villageId') villageId?: string,
    @Request() req?: any,
  ) {
    // ✅ Village Admin: paksa villageId = desa sendiri
    if (req?.user && req.user.role === 'VILLAGE_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.auditLogsService.getSummary(villageId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope() // ✅ Skip karena kita paksa villageId di bawah
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('villageId') villageId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Request() req?: any,
  ) {
    // ✅ Village Admin: paksa villageId = desa sendiri
    if (req?.user && req.user.role === 'VILLAGE_ADMIN') {
      villageId = req.user.villageId;
    }

    return this.auditLogsService.findAll({
      userId,
      action,
      resource,
      villageId,
      startDate,
      endDate,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async findOne(@Param('id') id: string, @Request() req?: any) {
    // ✅ Service akan cek ownership
    return this.auditLogsService.findOne(id, req?.user);
  }

  @Post()
  @SkipRegionScope() // ✅ Internal endpoint (auto-log)
  async create(@Body() data: CreateAuditLogDto) {
    return this.auditLogsService.create(data);
  }

  @Delete('clean')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async cleanOld(@Query('days') days?: number) {
    return this.auditLogsService.cleanOld(days ? Number(days) : 90);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string) {
    return this.auditLogsService.delete(id);
  }
}
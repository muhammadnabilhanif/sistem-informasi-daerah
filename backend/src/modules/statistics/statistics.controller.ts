import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('super-admin')
  @SkipRegionScope()
  async getSuperAdminStats() {
    return this.statisticsService.getSuperAdminStats();
  }

  @Get('village')
  @SkipRegionScope()
  async getVillageStats(@Request() req) {
    const villageId = req.user?.villageId;
    if (!villageId) return { message: 'Village Admin tidak memiliki desa terdaftar' };
    return this.statisticsService.getVillageStats(villageId);
  }

  @Get('citizen')
  @SkipRegionScope()
  async getCitizenStats(@Request() req) {
    const villageId = req.user?.villageId;
    if (!villageId) return { message: 'Citizen tidak memiliki desa terdaftar' };
    return this.statisticsService.getCitizenStats(villageId);
  }

  @Get('activities')
  @SkipRegionScope()
  async getRecentActivities(@Request() req) {
    const villageId = req.user?.villageId;
    return this.statisticsService.getRecentActivities(5, villageId);
  }

  // ✅ Endpoint RT (Memanggil Service)
  @Get('rt')
  @SkipRegionScope()
  async getRtStats(@Request() req) {
    return this.statisticsService.getRtStats(req.user);
  }

  // ✅ Endpoint RW (Memanggil Service)
  @Get('rw')
  @SkipRegionScope()
  async getRwStats(@Request() req) {
    return this.statisticsService.getRwStats(req.user);
  }
}
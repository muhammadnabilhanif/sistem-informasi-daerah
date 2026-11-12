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
import { ResidentsService } from './residents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateResidentStatisticDto, UpdateResidentStatisticDto } from './dto/resident-statistic.dto';

@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private residentsService: ResidentsService) {}

  @Get('statistics/public')
  @SkipRegionScope()
  async getPublicStatistics(@Query('villageId') villageId: string) {
    return this.residentsService.findLatest(villageId);
  }

  @Get('statistics')
  async findAll(
    @Query('villageId') villageId?: string,
    @Query('year') year?: number,
    @Request() req?: any,
  ) {
    if (req?.user && req.user.role !== 'SUPER_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.residentsService.findAll(villageId, year ? Number(year) : undefined);
  }

  @Get('statistics/:id')
  async findOne(@Param('id') id: string) {
    return this.residentsService.findOne(id);
  }

  @Post('statistics')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async create(@Body() data: CreateResidentStatisticDto, @Request() req) {
    if (req.user.role === 'VILLAGE_ADMIN') {
      data.villageId = req.user.villageId;
    }
    return this.residentsService.create(data);
  }

  @Put('statistics/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async update(
    @Param('id') id: string,
    @Body() data: UpdateResidentStatisticDto,
    @Request() req,
  ) {
    return this.residentsService.update(id, data, req.user);
  }

  @Delete('statistics/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string, @Request() req) {
    return this.residentsService.delete(id, req.user);
  }
}
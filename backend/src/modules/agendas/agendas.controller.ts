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
import { AgendasService } from './agendas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';

@Controller('agendas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendasController {
  constructor(private agendasService: AgendasService) {}

  @Get('public')
  @SkipRegionScope()
  async getPublicAgendas(@Query('villageId') villageId: string) {
    return this.agendasService.findPublic(villageId);
  }

  @Get()
  async findAll(
    @Query('villageId') villageId?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    if (req?.user && req.user.role !== 'SUPER_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.agendasService.findAll(villageId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.agendasService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async create(@Body() data: CreateAgendaDto, @Request() req) {
    if (req.user.role === 'VILLAGE_ADMIN') {
      data.villageId = req.user.villageId;
    }
    return this.agendasService.create(data, req.user.id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async update(@Param('id') id: string, @Body() data: UpdateAgendaDto, @Request() req) {
    return this.agendasService.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string, @Request() req) {
    return this.agendasService.delete(id, req.user);
  }
}
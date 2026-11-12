import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VillagesService } from './villages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVillageProfileDto, UpdateVillageProfileDto } from './dto/village-profile.dto';
import { CreateVillageOfficialDto, UpdateVillageOfficialDto } from './dto/village-official.dto';
import { CreateVillageProgramDto, UpdateVillageProgramDto } from './dto/village-program.dto';

@Controller('villages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VillagesController {
  constructor(private villagesService: VillagesService) {}

  // ==================== PROFILE ====================

  @Get(':villageId/profile')
async getProfile(@Param('villageId') villageId: string, @Request() req) {
  return this.villagesService.getProfileByVillage(villageId, req.user);
}

  @Post('profile')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async createProfile(@Body() data: CreateVillageProfileDto, @Request() req) {
    return this.villagesService.createProfile(data, req.user);
  }

  @Put(':villageId/profile')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  async updateProfile(
    @Param('villageId') villageId: string,
    @Body() data: UpdateVillageProfileDto,
    @Request() req,
  ) {
    return this.villagesService.updateProfile(villageId, data, req.user);
  }

  @Delete(':villageId/profile')
  @Roles('SUPER_ADMIN')
  async deleteProfile(@Param('villageId') villageId: string) {
    return this.villagesService.deleteProfile(villageId);
  }

  // ==================== OFFICIALS ====================

  @Get(':villageId/officials')
  async getOfficials(@Param('villageId') villageId: string) {
    return this.villagesService.getOfficialsByVillage(villageId);
  }

  @Post('officials')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async createOfficial(@Body() data: CreateVillageOfficialDto, @Request() req) {
    return this.villagesService.createOfficial(data, req.user);
  }

  @Put('officials/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  async updateOfficial(
    @Param('id') id: string,
    @Body() data: UpdateVillageOfficialDto,
    @Request() req,
  ) {
    return this.villagesService.updateOfficial(id, data, req.user);
  }

  @Delete('officials/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  async deleteOfficial(@Param('id') id: string, @Request() req) {
    return this.villagesService.deleteOfficial(id, req.user);
  }

  // ==================== PROGRAMS ====================

  @Get(':villageId/programs')
  async getPrograms(@Param('villageId') villageId: string) {
    return this.villagesService.getProgramsByVillage(villageId);
  }

  @Post('programs')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async createProgram(@Body() data: CreateVillageProgramDto, @Request() req) {
    return this.villagesService.createProgram(data, req.user);
  }

  @Put('programs/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  async updateProgram(
    @Param('id') id: string,
    @Body() data: UpdateVillageProgramDto,
    @Request() req,
  ) {
    return this.villagesService.updateProgram(id, data, req.user);
  }

  @Delete('programs/:id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  async deleteProgram(@Param('id') id: string, @Request() req) {
    return this.villagesService.deleteProgram(id, req.user);
  }
}
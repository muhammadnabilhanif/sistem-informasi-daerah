import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('stats')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async getStats() {
    return this.usersService.getStats();
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('warga-rt')
  @Roles('RT_ADMIN', 'SUPER_ADMIN')
  @SkipRegionScope()
  async findWargaByRt(@Request() req: any) {
    return this.usersService.findWargaByRt(req.user.id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Put(':id/change-password')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async changePassword(@Param('id') id: string, @Body() data: ChangePasswordDto) {
    return this.usersService.changePassword(id, data);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
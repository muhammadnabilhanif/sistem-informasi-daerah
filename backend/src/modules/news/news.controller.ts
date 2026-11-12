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
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Controller('news')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get('public')
  @SkipRegionScope()
  async getPublicNews(@Query('villageId') villageId: string) {
    return this.newsService.findPublic(villageId);
  }

  @Get('slug/:slug')
  @SkipRegionScope()
  async findBySlug(@Param('slug') slug: string) {
    return this.newsService.findBySlug(slug);
  }

  @Get()
  async findAll(
    @Query('villageId') villageId?: string,
    @Query('status') status?: string,
    @Request() req?: any,
  ) {
    // ✅ Village Admin & Citizen: paksa villageId = desa sendiri
    if (req?.user && req.user.role !== 'SUPER_ADMIN') {
      villageId = req.user.villageId;
    }
    return this.newsService.findAll(villageId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async create(@Body() data: CreateNewsDto, @Request() req) {
    if (req.user.role === 'VILLAGE_ADMIN') {
      data.villageId = req.user.villageId;
    }
    return this.newsService.create(data, req.user.id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async update(@Param('id') id: string, @Body() data: UpdateNewsDto, @Request() req) {
    return this.newsService.update(id, data, req.user);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async delete(@Param('id') id: string, @Request() req) {
    return this.newsService.delete(id, req.user);
  }

  @Post(':id/publish')
  @Roles('SUPER_ADMIN', 'VILLAGE_ADMIN')
  @SkipRegionScope()
  async publish(@Param('id') id: string, @Request() req) {
    return this.newsService.publish(id, req.user);
  }
}
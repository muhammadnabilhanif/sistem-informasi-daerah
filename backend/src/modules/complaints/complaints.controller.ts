import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // <-- Path diperbaiki

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  create(@Body() createComplaintDto: any, @Req() req: any) {
    return this.complaintsService.create(req.user.id, createComplaintDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.complaintsService.findAll(req.user);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.complaintsService.updateStatus(id, status);
  }
}
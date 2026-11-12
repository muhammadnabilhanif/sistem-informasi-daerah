import { Module } from '@nestjs/common';
import { VillagesController } from './villages.controller';
import { VillagesService } from './villages.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [VillagesController],
  providers: [VillagesService, PrismaService],
  exports: [VillagesService],
})
export class VillagesModule {}
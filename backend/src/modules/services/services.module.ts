import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfService } from './pdf/pdf.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, PrismaService, PdfService],
  exports: [ServicesService],
})
export class ServicesModule { }
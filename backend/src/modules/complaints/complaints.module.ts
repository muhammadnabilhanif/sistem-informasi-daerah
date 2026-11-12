import { Module } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { ComplaintsController } from './complaints.controller';
import { PrismaService } from '../../prisma/prisma.service'; // Path sudah benar

@Module({
  controllers: [ComplaintsController],
  providers: [ComplaintsService, PrismaService], // Inject PrismaService langsung di sini
})
export class ComplaintsModule {}
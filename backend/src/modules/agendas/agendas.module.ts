import { Module } from '@nestjs/common';
import { AgendasController } from './agendas.controller';
import { AgendasService } from './agendas.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AgendasController],
  providers: [AgendasService, PrismaService],
  exports: [AgendasService],
})
export class AgendasModule {}
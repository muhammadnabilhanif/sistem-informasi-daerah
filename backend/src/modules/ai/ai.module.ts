import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PermissionService } from './services/permission.service';
import { KnowledgeService } from './services/knowledge.service';
import { ContextBuilderService } from './services/context-builder.service';
import { ApiKeyManagerService } from './services/api-key-manager.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    PermissionService,
    KnowledgeService,
    ContextBuilderService,
    ApiKeyManagerService,
    PrismaService,
  ],
  exports: [AiService],
})
export class AiModule {}
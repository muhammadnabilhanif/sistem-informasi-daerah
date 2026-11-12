import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // ✅ TAMBAH
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { RegionsModule } from './modules/regions/regions.module';
import { VillagesModule } from './modules/villages/villages.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { NewsModule } from './modules/news/news.module';
import { AgendasModule } from './modules/agendas/agendas.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { UsersModule } from './modules/users/users.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AiModule } from './modules/ai/ai.module';
import { PrismaService } from './prisma/prisma.service';
import { RegionScopeGuard } from './common/guards/region-scope.guard';
import { ServicesModule } from './modules/services/services.module'; 
import { MailModule } from './mail/mail.module'; 
import { ComplaintsModule } from './modules/complaints/complaints.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    
    // ✅ TAMBAH RATE LIMITING
    ThrottlerModule.forRoot([
      {
        ttl: 60000,   // 60 detik (dalam milidetik)
        limit: 100,   // max 100 request per 60 detik (default)
      },
    ]),
    
    AuthModule,
    StatisticsModule,
    RegionsModule,
    VillagesModule,
    AnnouncementsModule,
    NewsModule,
    AgendasModule,
    DocumentsModule,
    ResidentsModule,
    UsersModule,
    AuditLogsModule,
    AiModule,
    ServicesModule,
    MailModule,
    ComplaintsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: RegionScopeGuard,
    },
    // ✅ TAMBAH THROTTLER GUARD (GLOBAL)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
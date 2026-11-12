import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditLogsService } from './modules/audit-logs/audit-logs.service';

async function bootstrap() {
  try {
    console.log('🚀 Starting backend...');

    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // ✅ Serve file statis dari folder uploads
    app.useStaticAssets(join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });

    // ✅ Register Audit Log Interceptor (Auto-Logging)
    const auditLogsService = app.get(AuditLogsService);
    app.useGlobalInterceptors(new AuditLogInterceptor(auditLogsService));

    app.enableCors({
      origin: 'http://localhost:3001',
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.listen(3000,'0.0.0.0');
    console.log('✅ Backend running on http://localhost:3000');
    console.log('✅ Health: http://localhost:3000/health');
    console.log('✅ Static files: http://localhost:3000/uploads/');
    console.log('✅ Audit log interceptor: ACTIVE');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

bootstrap();
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../modules/audit-logs/audit-logs.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const startTime = Date.now();

    // Hanya log untuk method POST, PUT, PATCH, DELETE
    const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (shouldLog && user) {
            const duration = Date.now() - startTime;
            const parts = url.split('/').filter(Boolean);
            const resource = parts[0] || 'unknown';

            // Skip log untuk audit-logs sendiri
            if (resource === 'audit-logs') return;

            this.auditLogsService.create({
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userRole: user.role,
              villageId: user.villageId,
              action: method === 'POST' ? 'CREATE' : method === 'PUT' || method === 'PATCH' ? 'UPDATE' : 'DELETE',
              resource,
              resourceId: parts[1] || undefined,
              description: `${method} ${url}`,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              statusCode: 200,
              durationMs: duration,
            }).catch((err) => console.error('Audit log error:', err));
          }
        },
      }),
    );
  }
}
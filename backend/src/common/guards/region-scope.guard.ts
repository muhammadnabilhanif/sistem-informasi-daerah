import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_REGION_SCOPE } from '../decorators/skip-region-scope.decorator';

@Injectable()
export class RegionScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skipScope = this.reflector.getAllAndOverride<boolean>(SKIP_REGION_SCOPE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipScope) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // ✅ FIX: Jangan throw jika user belum ada
    // Biarkan JwtAuthGuard yang handle autentikasi
    if (!user) {
      return true;
    }

    // Super Admin: bypass
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Ambil villageId dari params, query, atau body
    const villageId = this.extractVillageId(request);
    if (!villageId) return true;

    // Village Admin & Citizen: hanya desa sendiri
    if (user.villageId !== villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke wilayah ini');
    }

    return true;
  }

  private extractVillageId(request: any): string | null {
    if (request.params?.villageId) return request.params.villageId;
    if (request.query?.villageId) return request.query.villageId;
    if (request.body?.villageId) return request.body.villageId;
    return null;
  }
}
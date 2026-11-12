import { Injectable } from '@nestjs/common';

export interface UserScope {
  userId: string;
  userName: string; // ✅ Tambahkan ini agar AI tahu nama user
  role: string;
  villageId?: string;
  allowedVillages: string[];
  dataVisibility: 'ALL' | 'VILLAGE' | 'PUBLIC';
  allowedResources: string[];
}

@Injectable()
export class PermissionService {
  getScope(user: any): UserScope {
    const baseScope = {
      userId: user.id,
      userName: user.name, // ✅ Ambil nama dari data user (JWT/Database)
      role: user.role,
      villageId: user.villageId,
    };

    switch (user.role) {
      case 'SUPER_ADMIN':
        return {
          ...baseScope,
          allowedVillages: [], // Kosong berarti akses ke semua desa
          dataVisibility: 'ALL',
          allowedResources: [
            'villages', 'village_profiles', 'village_officials',
            'village_programs', 'news', 'announcements', 'agendas',
            'documents', 'statistics', 'users', 'audit_logs',
            'service_requests',
          ],
        };

      case 'VILLAGE_ADMIN':
        return {
          ...baseScope,
          allowedVillages: user.villageId ? [user.villageId] : [],
          dataVisibility: 'VILLAGE',
          allowedResources: [
            'village_profiles', 'village_officials', 'village_programs',
            'news', 'announcements', 'agendas', 'documents', 'statistics',
            'users', 'service_requests',
          ],
        };

      case 'RT_ADMIN':
        return {
          ...baseScope,
          allowedVillages: user.villageId ? [user.villageId] : [],
          dataVisibility: 'VILLAGE',
          allowedResources: [
            'village_profiles', 'village_officials', 'village_programs',
            'news', 'announcements', 'agendas', 'documents', 'statistics',
            'service_requests',
          ],
        };

      case 'RW_ADMIN':
        return {
          ...baseScope,
          allowedVillages: user.villageId ? [user.villageId] : [],
          dataVisibility: 'VILLAGE',
          allowedResources: [
            'village_profiles', 'village_officials', 'village_programs',
            'news', 'announcements', 'agendas', 'documents', 'statistics',
            'service_requests',
          ],
        };

      case 'CITIZEN':
      default:
        return {
          ...baseScope,
          allowedVillages: user.villageId ? [user.villageId] : [],
          dataVisibility: 'PUBLIC',
          allowedResources: [
            'village_profiles', 'village_officials', 'village_programs',
            'news', 'announcements', 'agendas', 'documents', 'statistics',
            'service_requests',
          ],
        };
    }
  }

  canAccess(scope: UserScope, resource: string): boolean {
    return scope.allowedResources.includes(resource);
  }

  canAccessVillage(scope: UserScope, villageId: string): boolean {
    if (scope.dataVisibility === 'ALL') return true;
    return scope.allowedVillages.includes(villageId);
  }

  canViewSensitiveData(scope: UserScope): boolean {
    return scope.role === 'SUPER_ADMIN' || scope.role === 'VILLAGE_ADMIN';
  }
}
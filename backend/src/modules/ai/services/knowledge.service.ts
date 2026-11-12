import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionService, UserScope } from './permission.service';

@Injectable()
export class KnowledgeService {
  constructor(
    private prisma: PrismaService,
    private permissionService: PermissionService,
  ) {}

  async getContext(scope: UserScope, villageId?: string): Promise<any> {
    const targetVillageId = this.resolveVillageId(scope, villageId);

    if (!targetVillageId) {
      return null;
    }

    const context: any = {
      village: null,
      profile: null,
      officials: [],
      programs: [],
      statistics: null,
      recentNews: [],
      recentAnnouncements: [],
      upcomingAgendas: [],
      documents: [],
    };

    // 1. Ambil data desa
    const village = await this.prisma.village.findFirst({
      where: { id: targetVillageId, deletedAt: null },
      include: {
        district: {
          include: {
            regency: {
              include: { province: true },
            },
          },
        },
      },
    });

    if (!village) return null;

    context.village = {
      id: village.id,
      name: village.name,
      type: village.type,
      district: village.district?.name,
      regency: village.district?.regency?.name,
      province: village.district?.regency?.province?.name,
    };

    // 2. Profil desa
    const profileWhere: any = { villageId: targetVillageId };
    if (scope.dataVisibility === 'PUBLIC') {
      profileWhere.status = 'PUBLISHED';
    }

    context.profile = await this.prisma.villageProfile.findFirst({
      where: profileWhere,
      select: {
        description: true, vision: true, mission: true,
        address: true, phone: true, email: true, website: true,
      },
    });

    // 3. Struktur pemerintahan
    const officialsWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
      isActive: true,
    };
    if (scope.dataVisibility === 'PUBLIC') {
      officialsWhere.isPublic = true;
    }

    context.officials = await this.prisma.villageOfficial.findMany({
      where: officialsWhere,
      select: { name: true, position: true, positionLevel: true },
      orderBy: [{ positionLevel: 'asc' }, { orderIndex: 'asc' }],
      take: 20,
    });

    // 4. Program kerja
    const programsWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
    };
    if (scope.dataVisibility === 'PUBLIC') {
      programsWhere.isPublic = true;
    }

    context.programs = await this.prisma.villageProgram.findMany({
      where: programsWhere,
      select: {
        title: true, description: true, category: true,
        status: true, budget: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 5. Statistik penduduk
    context.statistics = await this.prisma.residentStatistic.findFirst({
      where: { villageId: targetVillageId },
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
      select: {
        year: true, semester: true, totalPopulation: true,
        maleCount: true, femaleCount: true, totalHouseholds: true,
        totalFamilies: true, ageGroups: true, educationStats: true,
        occupationStats: true,
      },
    });

    // 6. Berita terbaru
    const newsWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
    };
    if (scope.dataVisibility === 'PUBLIC') {
      newsWhere.status = 'PUBLISHED';
      newsWhere.isPublic = true;
    }

    context.recentNews = await this.prisma.news.findMany({
      where: newsWhere,
      select: { title: true, excerpt: true, category: true, publishedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 7. Pengumuman terbaru
    const announcementWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
    };
    if (scope.dataVisibility === 'PUBLIC') {
      announcementWhere.status = 'PUBLISHED';
      announcementWhere.isPublic = true;
    }

    context.recentAnnouncements = await this.prisma.announcement.findMany({
      where: announcementWhere,
      select: { title: true, summary: true, priority: true, publishedAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 8. Agenda mendatang
    const agendaWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
      status: { in: ['UPCOMING', 'ONGOING'] },
    };
    if (scope.dataVisibility === 'PUBLIC') {
      agendaWhere.isPublic = true;
    }

    context.upcomingAgendas = await this.prisma.agenda.findMany({
      where: agendaWhere,
      select: { title: true, description: true, location: true, startDatetime: true },
      orderBy: { startDatetime: 'asc' },
      take: 5,
    });

    // 9. Dokumen publik
    const docWhere: any = {
      villageId: targetVillageId,
      deletedAt: null,
    };
    if (scope.dataVisibility === 'PUBLIC') {
      docWhere.status = 'PUBLISHED';
      docWhere.isPublic = true;
    }

    context.documents = await this.prisma.publicDocument.findMany({
      where: docWhere,
      select: { title: true, category: true, fileType: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return context;
  }

  private resolveVillageId(scope: UserScope, requestedVillageId?: string): string | null {
    if (scope.dataVisibility === 'ALL') {
      return requestedVillageId || null;
    }

    if (requestedVillageId && !this.permissionService.canAccessVillage(scope, requestedVillageId)) {
      return scope.villageId || null;
    }

    return requestedVillageId || scope.villageId || null;
  }
}
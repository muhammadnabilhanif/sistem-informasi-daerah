import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResidentStatisticDto, UpdateResidentStatisticDto } from './dto/resident-statistic.dto';

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateResidentStatisticDto) {
    return this.prisma.residentStatistic.create({
      data: {
        villageId: data.villageId,
        year: data.year,
        semester: data.semester || 1,
        totalPopulation: data.totalPopulation || 0,
        maleCount: data.maleCount || 0,
        femaleCount: data.femaleCount || 0,
        totalHouseholds: data.totalHouseholds || 0,
        totalFamilies: data.totalFamilies || 0,
        ageGroups: data.ageGroups || null,
        educationStats: data.educationStats || null,
        occupationStats: data.occupationStats || null,
        religionStats: data.religionStats || null,
        dataSource: data.dataSource,
        notes: data.notes,
      },
    });
  }

  async findAll(villageId?: string, year?: number) {
    const where: any = {};
    if (villageId) where.villageId = villageId;
    if (year) where.year = year;

    return this.prisma.residentStatistic.findMany({
      where,
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
      include: {
        village: { select: { id: true, name: true } },
      },
    });
  }

  async findLatest(villageId: string) {
    const stat = await this.prisma.residentStatistic.findFirst({
      where: { villageId },
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
    });

    if (!stat) {
      return {
        totalPopulation: 0,
        maleCount: 0,
        femaleCount: 0,
        totalHouseholds: 0,
        totalFamilies: 0,
        ageGroups: {},
        educationStats: {},
        occupationStats: {},
        religionStats: {},
      };
    }

    return stat;
  }

  // ✅ Helper: cek ownership
  private async checkOwnership(id: string, user?: any) {
    const stat = await this.prisma.residentStatistic.findUnique({
      where: { id },
    });

    if (!stat) {
      throw new NotFoundException('Statistik tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && stat.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke statistik ini');
    }

    return stat;
  }

  async findOne(id: string, user?: any) {
    await this.checkOwnership(id, user);

    return this.prisma.residentStatistic.findUnique({
      where: { id },
      include: {
        village: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateResidentStatisticDto, user?: any) {
    await this.checkOwnership(id, user);

    return this.prisma.residentStatistic.update({
      where: { id },
      data: {
        year: data.year,
        semester: data.semester,
        totalPopulation: data.totalPopulation,
        maleCount: data.maleCount,
        femaleCount: data.femaleCount,
        totalHouseholds: data.totalHouseholds,
        totalFamilies: data.totalFamilies,
        ageGroups: data.ageGroups,
        educationStats: data.educationStats,
        occupationStats: data.occupationStats,
        religionStats: data.religionStats,
        dataSource: data.dataSource,
        notes: data.notes,
      },
    });
  }

  async delete(id: string, user?: any) {
    await this.checkOwnership(id, user);
    return this.prisma.residentStatistic.delete({ where: { id } });
  }
}
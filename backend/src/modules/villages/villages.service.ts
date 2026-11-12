import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVillageProfileDto, UpdateVillageProfileDto } from './dto/village-profile.dto';
import { CreateVillageOfficialDto, UpdateVillageOfficialDto } from './dto/village-official.dto';
import { CreateVillageProgramDto, UpdateVillageProgramDto } from './dto/village-program.dto';

@Injectable()
export class VillagesService {
  constructor(private prisma: PrismaService) { }

  // ==================== VILLAGE PROFILE ====================

  async createProfile(data: CreateVillageProfileDto, user?: any) {
    // ✅ Paksa villageId = desa user (untuk Village Admin)
    let villageId = data.villageId;
    if (user?.role === 'VILLAGE_ADMIN') {
      villageId = user.villageId;
    } else {
      villageId = data.villageId;
    }
    // ✅ Validasi villageId
    if (!villageId) {
      throw new BadRequestException('villageId wajib diisi');
    }

    return this.prisma.villageProfile.create({
      data: {
        villageId,
        description: data.description,
        history: data.history,
        vision: data.vision,
        mission: data.mission,
        motto: data.motto,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        latitude: data.latitude,
        longitude: data.longitude,
        totalAreaKm2: data.totalAreaKm2,
        landAreaKm2: data.landAreaKm2,
        waterAreaKm2: data.waterAreaKm2,
        northBoundary: data.northBoundary,
        southBoundary: data.southBoundary,
        westBoundary: data.westBoundary,
        eastBoundary: data.eastBoundary,
        status: data.status || 'DRAFT',
      },
    });
  }

  async getProfileByVillage(villageId: string, user?: any) {
    // ✅ Cek ownership DULU
    if (user && user.role !== 'SUPER_ADMIN' && villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke profil desa ini');
    }

    const profile = await this.prisma.villageProfile.findUnique({
      where: { villageId },
    });

    if (!profile) {
      throw new NotFoundException(`Profil desa tidak ditemukan`);
    }

    return profile;
  }

  async updateProfile(villageId: string, data: UpdateVillageProfileDto, user?: any) {
    // ✅ Cek ownership DULU
    if (user && user.role !== 'SUPER_ADMIN' && villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke profil desa ini');
    }

    // Baru cek profil
    await this.getProfileByVillage(villageId);

    return this.prisma.villageProfile.update({
      where: { villageId },
      data,
    });
  }

  async deleteProfile(villageId: string) {
    await this.getProfileByVillage(villageId);
    return this.prisma.villageProfile.delete({ where: { villageId } });
  }

  // ==================== VILLAGE OFFICIALS ====================

  async createOfficial(data: CreateVillageOfficialDto, user?: any) {
    let villageId: string;

    if (user?.role === 'VILLAGE_ADMIN') {
      villageId = user.villageId;
    } else {
      villageId = data.villageId;
    }

    if (!villageId) {
      throw new BadRequestException('villageId wajib diisi');
    }

    return this.prisma.villageOfficial.create({
      data: {
        villageId,
        name: data.name,
        position: data.position,
        positionLevel: data.positionLevel || 1,
        photoUrl: data.photoUrl,
        biography: data.biography,
        phone: data.phone,
        email: data.email,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive ?? true,
        isPublic: data.isPublic ?? true,
        orderIndex: data.orderIndex || 0,
      },
    });
  }

  async getOfficialsByVillage(villageId: string) {
    return this.prisma.villageOfficial.findMany({
      where: { villageId, deletedAt: null },
      orderBy: [{ positionLevel: 'asc' }, { orderIndex: 'asc' }],
    });
  }

  async updateOfficial(id: string, data: UpdateVillageOfficialDto, user?: any) {
    const official = await this.prisma.villageOfficial.findFirst({
      where: { id, deletedAt: null },
    });

    if (!official) {
      throw new NotFoundException(`Perangkat desa tidak ditemukan`);
    }

    if (user && user.role !== 'SUPER_ADMIN' && official.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke perangkat desa ini');
    }

    return this.prisma.villageOfficial.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteOfficial(id: string, user?: any) {
    const official = await this.prisma.villageOfficial.findFirst({
      where: { id, deletedAt: null },
    });

    if (!official) {
      throw new NotFoundException(`Perangkat desa tidak ditemukan`);
    }

    if (user && user.role !== 'SUPER_ADMIN' && official.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke perangkat desa ini');
    }

    return this.prisma.villageOfficial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== VILLAGE PROGRAMS ====================

  async createProgram(data: CreateVillageProgramDto, user?: any) {
    let villageId: string;

    if (user?.role === 'VILLAGE_ADMIN') {
      villageId = user.villageId;
    } else {
      villageId = data.villageId;
    }

    if (!villageId) {
      throw new BadRequestException('villageId wajib diisi');
    }

    return this.prisma.villageProgram.create({
      data: {
        villageId,
        title: data.title,
        description: data.description,
        category: data.category,
        budget: data.budget,
        status: data.status || 'PLANNING',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  async getProgramsByVillage(villageId: string) {
    return this.prisma.villageProgram.findMany({
      where: { villageId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProgram(id: string, data: UpdateVillageProgramDto, user?: any) {
    const program = await this.prisma.villageProgram.findFirst({
      where: { id, deletedAt: null },
    });

    if (!program) {
      throw new NotFoundException(`Program tidak ditemukan`);
    }

    if (user && user.role !== 'SUPER_ADMIN' && program.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke program ini');
    }

    return this.prisma.villageProgram.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async deleteProgram(id: string, user?: any) {
    const program = await this.prisma.villageProgram.findFirst({
      where: { id, deletedAt: null },
    });

    if (!program) {
      throw new NotFoundException(`Program tidak ditemukan`);
    }

    if (user && user.role !== 'SUPER_ADMIN' && program.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke program ini');
    }

    return this.prisma.villageProgram.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
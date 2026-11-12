import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgendaDto, UpdateAgendaDto } from './dto/agenda.dto';

@Injectable()
export class AgendasService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAgendaDto, userId?: string) {
    return this.prisma.agenda.create({
      data: {
        villageId: data.villageId,
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        startDatetime: new Date(data.startDatetime),
        endDatetime: data.endDatetime ? new Date(data.endDatetime) : null,
        category: data.category,
        organizer: data.organizer,
        status: data.status || 'UPCOMING',
        isPublic: data.isPublic ?? true,
        createdById: userId,
      },
    });
  }

  async findAll(villageId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (villageId) where.villageId = villageId;
    if (status) where.status = status;

    return this.prisma.agenda.findMany({
      where,
      orderBy: { startDatetime: 'asc' },
      include: {
        village: { select: { id: true, name: true } },
      },
    });
  }

  async findPublic(villageId: string) {
    return this.prisma.agenda.findMany({
      where: {
        villageId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        isPublic: true,
        deletedAt: null,
      },
      orderBy: { startDatetime: 'asc' },
    });
  }

  // ✅ Helper: cek ownership
  private async checkOwnership(id: string, user?: any) {
    const agenda = await this.prisma.agenda.findFirst({
      where: { id, deletedAt: null },
    });

    if (!agenda) {
      throw new NotFoundException('Agenda tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && agenda.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke agenda ini');
    }

    return agenda;
  }

  async findOne(id: string, user?: any) {
    await this.checkOwnership(id, user);

    return this.prisma.agenda.findFirst({
      where: { id, deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateAgendaDto, user?: any) {
    await this.checkOwnership(id, user);

    const updateData: any = { ...data };
    if (data.startDatetime) {
      updateData.startDatetime = new Date(data.startDatetime);
    }
    if (data.endDatetime) {
      updateData.endDatetime = new Date(data.endDatetime);
    }

    return this.prisma.agenda.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, user?: any) {
    await this.checkOwnership(id, user);
    return this.prisma.agenda.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAnnouncementDto, userId?: string) {
    return this.prisma.announcement.create({
      data: {
        villageId: data.villageId,
        title: data.title,
        content: data.content,
        summary: data.summary,
        priority: data.priority || 'NORMAL',
        status: data.status || 'DRAFT',
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : null,
        isPublic: data.isPublic ?? true,
        createdById: userId,
      },
    });
  }

  async findAll(villageId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (villageId) where.villageId = villageId;
    if (status) where.status = status;

    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        village: { select: { id: true, name: true } },
      },
    });
  }

  async findPublic(villageId: string) {
    return this.prisma.announcement.findMany({
      where: {
        villageId,
        status: 'PUBLISHED',
        isPublic: true,
        deletedAt: null,
        OR: [{ expiredAt: null }, { expiredAt: { gt: new Date() } }],
      },
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  async findOne(id: string, user?: any) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && announcement.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengumuman ini');
    }

    return announcement;
  }

  async update(id: string, data: UpdateAnnouncementDto, user?: any) {
    await this.findOne(id, user);

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        summary: data.summary,
        priority: data.priority,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : undefined,
        isPublic: data.isPublic,
      },
    });
  }

  async delete(id: string, user?: any) {
    await this.findOne(id, user);
    return this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async publish(id: string, user?: any) {
    await this.findOne(id, user);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }
}
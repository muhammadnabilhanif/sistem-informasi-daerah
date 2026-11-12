import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        userRole: data.userRole,
        villageId: data.villageId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        statusCode: data.statusCode,
        errorMessage: data.errorMessage,
        durationMs: data.durationMs,
      },
    });
  }

  async findAll(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    villageId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.villageId) where.villageId = filters.villageId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          village: { select: { id: true, name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  // ✅ UPDATE: tambah user? parameter + cek ownership
  async findOne(id: string, user?: any) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        village: { select: { id: true, name: true } },
      },
    });

    if (!log) {
      throw new NotFoundException('Audit log tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && log.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke log ini');
    }

    return log;
  }

  async getSummary(villageId?: string) {
    const where: any = {};
    if (villageId) where.villageId = villageId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayCount, byAction, byResource, recentActivities] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({
        where: { ...where, createdAt: { gte: today } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
        orderBy: { _count: { resource: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          userName: true,
          description: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      todayCount,
      byAction: byAction.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
      byResource: byResource.map((r) => ({
        resource: r.resource,
        count: r._count.resource,
      })),
      recentActivities,
    };
  }

  async delete(id: string) {
    return this.prisma.auditLog.delete({ where: { id } });
  }

  async cleanOld(daysOld: number = 90) {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: date } },
    });

    return { deleted: result.count };
  }
}
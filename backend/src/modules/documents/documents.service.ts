import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/document.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Helper: validasi magic bytes (file signature)
  private validateFileSignature(filePath: string, mimeType: string): boolean {
    try {
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const hex = buffer.toString('hex').toUpperCase();

      const signatures: Record<string, string[]> = {
        'image/jpeg': ['FFD8FF'],
        'image/jpg': ['FFD8FF'],
        'image/png': ['89504E47'],
        'application/pdf': ['25504446'],
        'application/msword': ['D0CF11E0'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['504B0304'],
        'application/vnd.ms-excel': ['D0CF11E0'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['504B0304'],
      };

      const validSignatures = signatures[mimeType];
      if (!validSignatures) return false;

      return validSignatures.some((sig) => hex.startsWith(sig));
    } catch (err) {
      console.error('Gagal validasi file signature:', err);
      return false;
    }
  }

  // ✅ Helper: cek ownership
  private async checkOwnership(id: string, user?: any) {
    const doc = await this.prisma.publicDocument.findFirst({
      where: { id, deletedAt: null },
    });

    if (!doc) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && doc.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke dokumen ini');
    }

    return doc;
  }

  async create(data: CreateDocumentDto, file: any, userId?: string) {
    // ✅ Validasi magic bytes (file signature)
    if (!this.validateFileSignature(file.path, file.mimetype)) {
      // Hapus file yang tidak valid
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error('Gagal hapus file invalid:', err);
      }
      throw new BadRequestException('File tidak valid — konten tidak sesuai tipe');
    }

    return this.prisma.publicDocument.create({
      data: {
        villageId: data.villageId,
        title: data.title,
        description: data.description,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        fileType: path.extname(file.originalname).replace('.', ''),
        mimeType: file.mimetype,
        category: data.category,
        tags: data.tags,
        status: data.status || 'DRAFT',
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        expiredAt: data.expiredAt ? new Date(data.expiredAt) : null,
        isPublic: data.isPublic ?? true,
        uploadedById: userId,
      },
    });
  }

  async findAll(villageId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (villageId) where.villageId = villageId;
    if (status) where.status = status;

    return this.prisma.publicDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        village: { select: { id: true, name: true } },
      },
    });
  }

  async findPublic(villageId: string) {
    return this.prisma.publicDocument.findMany({
      where: {
        villageId,
        status: 'PUBLISHED',
        isPublic: true,
        deletedAt: null,
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        fileType: true,
        category: true,
        downloads: true,
        publishedAt: true,
      },
    });
  }

  async findOne(id: string, user?: any) {
    await this.checkOwnership(id, user);

    return this.prisma.publicDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateDocumentDto, user?: any) {
    // ✅ Cek ownership DULU
    await this.checkOwnership(id, user);

    const updateData: any = { ...data };
    if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    }
    if (data.expiredAt) {
      updateData.expiredAt = new Date(data.expiredAt);
    }

    return this.prisma.publicDocument.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, user?: any) {
    // ✅ Cek ownership
    const doc = await this.checkOwnership(id, user);

    // Hapus file fisik
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        console.error('Gagal hapus file:', err);
      }
    }

    return this.prisma.publicDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async incrementDownload(id: string) {
    await this.checkOwnership(id);
    return this.prisma.publicDocument.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });
  }

  async publish(id: string, user?: any) {
    // ✅ Cek ownership
    await this.checkOwnership(id, user);

    return this.prisma.publicDocument.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }
}
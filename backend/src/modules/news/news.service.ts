import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNewsDto, UpdateNewsDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // ✅ Helper: cek ownership
  private async checkOwnership(id: string, user?: any) {
    const news = await this.prisma.news.findFirst({
      where: { id, deletedAt: null },
    });

    if (!news) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    if (user && user.role !== 'SUPER_ADMIN' && news.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke berita ini');
    }

    return news;
  }

  async create(data: CreateNewsDto, userId?: string) {
    let slug = data.slug || this.generateSlug(data.title);

    const existing = await this.prisma.news.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    return this.prisma.news.create({
      data: {
        villageId: data.villageId,
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        thumbnailUrl: data.thumbnailUrl,
        authorName: data.authorName,
        authorId: userId,
        category: data.category,
        tags: data.tags,
        status: data.status || 'DRAFT',
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        isFeatured: data.isFeatured ?? false,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  async findAll(villageId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (villageId) where.villageId = villageId;
    if (status) where.status = status;

    return this.prisma.news.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        village: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });
  }

  async findPublic(villageId: string) {
    return this.prisma.news.findMany({
      where: {
        villageId,
        status: 'PUBLISHED',
        isPublic: true,
        deletedAt: null,
      },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnailUrl: true,
        authorName: true,
        category: true,
        views: true,
        publishedAt: true,
        isFeatured: true,
      },
    });
  }

  async findBySlug(slug: string) {
    const news = await this.prisma.news.findFirst({
      where: { slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
      },
    });

    if (!news) {
      throw new NotFoundException('Berita tidak ditemukan');
    }

    await this.prisma.news.update({
      where: { id: news.id },
      data: { views: { increment: 1 } },
    });

    return news;
  }

  async findOne(id: string, user?: any) {
    await this.checkOwnership(id, user);

    return this.prisma.news.findFirst({
      where: { id, deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, data: UpdateNewsDto, user?: any) {
    await this.checkOwnership(id, user);

    const updateData: any = { ...data };
    if (data.publishedAt) {
      updateData.publishedAt = new Date(data.publishedAt);
    }
    if (data.title && !data.slug) {
      updateData.slug = this.generateSlug(data.title);
    }

    return this.prisma.news.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, user?: any) {
    await this.checkOwnership(id, user);
    return this.prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async publish(id: string, user?: any) {
    await this.checkOwnership(id, user);
    return this.prisma.news.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }
}
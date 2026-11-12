import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Path sudah benar

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  // 1. Warga membuat aduan
  async create(userId: string, data: { title: string; description: string; imageUrl?: string }) {
    // Cari data user untuk mendapatkan rtId dan rwId
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    return this.prisma.complaint.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        userId: user.id,
        rtId: user.rtId, // Otomatis assign ke RT warga
        rwId: user.rwId, // Otomatis assign ke RW warga
      },
    });
  }

  // 2. Ambil daftar aduan (Bisa untuk Warga, RT, atau RW)
  async findAll(user: any) {
    let whereCondition = {};

    // Filter berdasarkan Role
    if (user.role === 'RT_ADMIN') {
      whereCondition = { rtId: user.rtId };
    } else if (user.role === 'RW_ADMIN') {
      whereCondition = { rwId: user.rwId };
    } else if (user.role === 'CITIZEN') {
      whereCondition = { userId: user.id };
    }
    // SUPER_ADMIN dan VILLAGE_ADMIN bisa melihat semua (whereCondition kosong)

    return this.prisma.complaint.findMany({
      where: whereCondition,
      include: {
        user: { select: { name: true, email: true } },
        // PERBAIKAN: Menggunakan 'number' sesuai schema.prisma Anda
        rt: { select: { number: true } }, 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. RT/RW mengubah status aduan
  async updateStatus(id: string, status: string) {
    return this.prisma.complaint.update({
      where: { id },
      data: { status },
    });
  }
}
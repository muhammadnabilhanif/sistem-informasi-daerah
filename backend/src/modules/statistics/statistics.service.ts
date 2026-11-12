import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getSuperAdminStats() {
    const [totalProvinces, totalRegencies, totalDistricts, totalVillages, totalUsers] = await Promise.all([
      this.prisma.province.count(),
      this.prisma.regency.count(),
      this.prisma.district.count(),
      
      // ✅ Perbaikan: Hanya hitung desa yang aktif
      this.prisma.village.count({ where: { deletedAt: null } }), 
      
      // ✅ Perbaikan: Hanya hitung user yang belum dihapus (soft delete)
      this.prisma.user.count({ where: { deletedAt: null } }), 
    ]);

    return {
      totalProvinces,
      totalRegencies,
      totalDistricts,
      totalVillages,
      totalUsers,
    };
  }

  async getVillageStats(villageId: string) {
    const [totalPrograms, totalNews] = await Promise.all([
      this.prisma.villageProgram.count({
        where: { villageId, status: 'ONGOING', deletedAt: null },
      }),
      this.prisma.news.count({
        where: { villageId, status: 'PUBLISHED', deletedAt: null },
      }),
    ]);

    const stats = await this.prisma.residentStatistic.findFirst({
      where: { villageId },
      orderBy: [{ year: 'desc' }, { semester: 'desc' }],
    });

    return {
      totalResidents: stats?.totalPopulation || 0,
      maleCount: stats?.maleCount || 0,
      femaleCount: stats?.femaleCount || 0,
      totalHouseholds: stats?.totalHouseholds || 0,
      totalPrograms,
      totalNews,
    };
  }

  async getCitizenStats(villageId: string) {
    const stats = await this.prisma.residentStatistic.findFirst({
      where: { villageId },
      orderBy: { year: 'desc' },
    });

    const [totalNews, totalPrograms] = await Promise.all([
      // ✅ Perbaikan: Tambahkan filter deletedAt agar berita/program terhapus tidak dihitung
      this.prisma.news.count({ where: { villageId, status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.villageProgram.count({ where: { villageId, isPublic: true, deletedAt: null } }),
    ]);

    return {
      totalResidents: stats?.totalPopulation || 0,
      maleCount: stats?.maleCount || 0,
      femaleCount: stats?.femaleCount || 0,
      totalHouseholds: stats?.totalHouseholds || 0,
      totalNews,
      totalPrograms,
      ageGroups: stats?.ageGroups || {},
      educationStats: stats?.educationStats || {},
      occupationStats: stats?.occupationStats || {},
    };
  }

  async getRecentActivities(limit: number = 5, villageId?: string) {
    const where: any = {};
    
    // Jika ada villageId (misal yang login Admin Desa), filter berdasarkan desa tersebut
    if (villageId) {
      where.villageId = villageId;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // Urutkan dari yang terbaru
      take: limit, // Batasi jumlah data yang diambil (default 5)
      select: {
        id: true,
        action: true,
        resource: true,
        userName: true,
        createdAt: true,
      },
    });
  }

  // ==========================================
  // ✅ STATISTIK UNTUK DASHBOARD RT
  // ==========================================
  async getRtStats(user: any) {
  // 1. Dapatkan ID RT (Cek dari JWT, jika kosong ambil dari DB)
  let rtId = user.rtId;
  if (!rtId) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    rtId = dbUser?.managedRtId;
  }

  // Jika Admin RT ini belum di-assign ke RT manapun
  if (!rtId) {
    return { 
      pendingRequests: 0, 
      totalCitizens: 0, 
      maleCount: 0,
      femaleCount: 0,
      agendas: [],
      totalPendingComplaints: 0 
    };
  }

  // 2. Hitung surat PENDING di RT ini
  const pendingRequests = await this.prisma.serviceRequest.count({
    where: {
      status: 'PENDING',
      applicant: { rtId: rtId }
    }
  });

  // 3. Hitung total warga
  const totalCitizens = await this.prisma.user.count({
    where: { rtId: rtId, deletedAt: null }
  });

  // ✅ PERBAIKAN: Hitung Laki-laki & Perempuan berdasarkan field gender
  const maleCount = await this.prisma.user.count({
    where: { 
      rtId: rtId, 
      deletedAt: null, 
      gender: 'MALE' 
    }
  });

  const femaleCount = await this.prisma.user.count({
    where: { 
      rtId: rtId, 
      deletedAt: null, 
      gender: 'FEMALE' 
    }
  });

  // 4. Ambil 3 Agenda Mendatang
  const agendas = await this.prisma.agenda.findMany({
    where: { 
      deletedAt: null,
      startDatetime: { gte: new Date() }
    },
    orderBy: { startDatetime: 'asc' },
    take: 3,
  });

  // 5. Hitung Aduan yang belum selesai di RT ini
  const totalPendingComplaints = await this.prisma.complaint.count({
    where: {
      rtId: rtId,
      status: {
        in: ['PENDING', 'PROCESSING']
      }
    }
  });

  return {
    pendingRequests,
    totalCitizens,
    maleCount,
    femaleCount,
    agendas,
    totalPendingComplaints
  };
}
  // ==========================================
  // ✅ STATISTIK UNTUK DASHBOARD RW
  // ==========================================
  async getRwStats(user: any) {
    // 1. Dapatkan ID RW (Cek dari JWT, jika kosong ambil dari DB)
    let rwId = user.rwId;
    if (!rwId) {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
      rwId = dbUser?.managedRwId;
    }

    if (!rwId) return { pendingRequests: 0, totalCitizens: 0, totalPendingComplaints: 0, complaintsByRt: [] };

    // 2. Hitung surat PENDING di RW ini
    const pendingRequests = await this.prisma.serviceRequest.count({
      where: {
        status: 'PENDING',
        applicant: { rwId: rwId } // Filter berdasarkan relasi user ke RW
      }
    });

    // 3. Hitung total warga di RW
    const totalCitizens = await this.prisma.user.count({
      where: { rwId: rwId, deletedAt: null }
    });

    // 4. ✅ TAMBAHAN: Hitung Aduan yang belum selesai di RW ini
    const totalPendingComplaints = await this.prisma.complaint.count({
      where: {
        rwId: rwId,
        status: {
          in: ['PENDING', 'PROCESSING']
        }
      }
    });

    // 5. ✅ TAMBAHAN: Statistik Aduan per RT (Untuk Grafik Batang RW)
    // Kita ambil semua RT di RW ini, lalu hitung aduannya
    const rts = await this.prisma.rt.findMany({
      where: { rwId: rwId },
      select: { id: true, number: true }
    });

    const complaintsByRt = await Promise.all(
      rts.map(async (rt) => {
        const count = await this.prisma.complaint.count({
          where: {
            rtId: rt.id,
            status: { in: ['PENDING', 'PROCESSING'] }
          }
        });
        return { rtNumber: rt.number, totalComplaints: count };
      })
    );

    return { 
      pendingRequests, 
      totalCitizens,
      totalPendingComplaints,
      complaintsByRt // ✅ Data ini bisa dipakai untuk grafik batang
    };
  }
}
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';
import { CreateServiceRequestDto, UpdateServiceRequestStatusDto } from './dto/service-request.dto';
import { generateRequestNumber } from './helpers/request-number.helper';
import { PdfService } from './pdf/pdf.service'; // ✅ TAMBAHKAN IMPORT INI
import { MailService } from '../../mail/mail.service';

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private mailService: MailService
  ) { }

  // ==================== SERVICE TYPES ====================

  async createType(data: CreateServiceTypeDto, user?: any) {
    let villageId = data.villageId;
    // Jika VILLAGE_ADMIN, paksa gunakan villageId miliknya
    if (user?.role === 'VILLAGE_ADMIN') {
      villageId = user.villageId;
    }

    return this.prisma.serviceType.create({
      data: {
        villageId,
        name: data.name,
        code: data.code,
        description: data.description,
        requirements: data.requirements || [],
        template: data.template,
        processingDays: data.processingDays || 1,
        isActive: data.isActive ?? true,
        orderIndex: data.orderIndex || 0,
      },
    });
  }

  async findAllTypes(villageId?: string) {
    const where: any = { deletedAt: null };
    if (villageId) where.villageId = villageId;

    return this.prisma.serviceType.findMany({
      where,
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        village: { select: { id: true, name: true } },
        _count: { select: { requests: true } },
      },
    });
  }

  async findOneType(id: string) {
    const type = await this.prisma.serviceType.findFirst({
      where: { id, deletedAt: null },
      include: {
        village: { select: { id: true, name: true } },
        _count: { select: { requests: true } },
      },
    });

    if (!type) {
      throw new NotFoundException('Jenis layanan tidak ditemukan');
    }

    return type;
  }

  async updateType(id: string, data: UpdateServiceTypeDto, user?: any) {
    await this.findOneType(id);

    if (user && user.role !== 'SUPER_ADMIN') {
      const type = await this.prisma.serviceType.findUnique({ where: { id } });
      if (type && type.villageId !== user.villageId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke layanan ini');
      }
    }

    return this.prisma.serviceType.update({
      where: { id },
      data,
    });
  }

  async deleteType(id: string, user?: any) {
    await this.findOneType(id);

    if (user && user.role !== 'SUPER_ADMIN') {
      const type = await this.prisma.serviceType.findUnique({ where: { id } });
      if (type && type.villageId !== user.villageId) {
        throw new ForbiddenException('Anda tidak memiliki akses ke layanan ini');
      }
    }

    return this.prisma.serviceType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== SERVICE REQUESTS ====================

  async createRequest(data: CreateServiceRequestDto, user: any) {
    const serviceType = await this.prisma.serviceType.findFirst({
      where: { id: data.serviceTypeId, deletedAt: null, isActive: true },
    });

    if (!serviceType) {
      throw new NotFoundException('Jenis layanan tidak ditemukan atau tidak aktif');
    }

    // PENGECEKAN AKSES DESA
    if (user.role === 'CITIZEN' && user.villageId && user.villageId !== serviceType.villageId) {
      throw new ForbiddenException('Anda hanya bisa mengajukan surat untuk desa Anda');
    }

    // ✅ FIX UTAMA: Ambil data user dari database untuk memastikan nama tidak undefined
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    // Fallback berlapis: pakai nama dari DB, kalau kosong pakai email, kalau kosong pakai string 'Warga'
    const safeApplicantName = dbUser?.name || dbUser?.email || 'Warga';

    const requestNumber = await generateRequestNumber(this.prisma, serviceType.code);

    const request = await this.prisma.serviceRequest.create({
      data: {
        requestNumber,
        serviceTypeId: serviceType.id,
        applicantId: user.id,
        purpose: data.purpose,
        notes: data.notes,
        attachments: data.attachments || [],
        applicantName: safeApplicantName,
        applicantNik: data.applicantNik,
        applicantPhone: data.applicantPhone,
        applicantAddress: data.applicantAddress,
        status: 'PENDING',
      },
      include: {
        serviceType: true,
      },
    });

    // Log status awal
    await this.prisma.serviceStatusLog.create({
      data: {
        requestId: request.id,
        status: 'PENDING',
        notes: 'Pengajuan dibuat',
        changedById: user.id,
      },
    });

    return request;
  }

  async findAllRequests(user: any, filters?: { status?: string; villageId?: string }) {
    const where: any = { deletedAt: null };

    // Scope berdasarkan role
    if (user.role === 'CITIZEN') {
      where.applicantId = user.id;
    } else if (user.role === 'RT_ADMIN' && user.rtId) {
      // ✅ RT hanya melihat surat dari warga yang rtId-nya sama
      where.applicant = { rtId: user.rtId };
    } else if (user.role === 'RW_ADMIN' && user.rwId) {
      // ✅ RW hanya melihat surat dari warga yang rwId-nya sama
      where.applicant = { rwId: user.rwId };
    } else if (user.role === 'VILLAGE_ADMIN') {
      if (user.villageId) {
        where.serviceType = { villageId: user.villageId };
      }
    } else {
      if (filters?.villageId) {
        where.serviceType = { villageId: filters.villageId };
      }
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        serviceType: {
          include: {
            village: { select: { id: true, name: true } },
          },
        },
        applicant: { select: { id: true, name: true, email: true, rtId: true, rwId: true, } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOneRequest(id: string, user: any) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, deletedAt: null },
      include: {
        serviceType: {
          include: {
            village: { select: { id: true, name: true } },
          },
        },
        applicant: { select: { id: true, name: true, email: true, phone: true } },
        verifiedBy: { select: { id: true, name: true } },
        statusLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    if (user.role === 'CITIZEN' && request.applicantId !== user.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    if (user.role === 'VILLAGE_ADMIN' && user.villageId && request.serviceType.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    return request;
  }

  async updateRequestStatus(
    id: string,
    data: UpdateServiceRequestStatusDto,
    user: any,
  ) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, deletedAt: null },
      include: { serviceType: true },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    if (user.role === 'CITIZEN') {
      throw new ForbiddenException('Warga tidak dapat mengubah status pengajuan');
    }

    if (user.role === 'VILLAGE_ADMIN' && user.villageId && request.serviceType.villageId !== user.villageId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
    }

    const updateData: any = {
      status: data.status,
    };

    if (data.status === 'VERIFIED') {
      updateData.verifiedById = user.id;
      updateData.verifiedAt = new Date();
    }

    if (user.role === 'RT_ADMIN') {
      updateData.verifiedByLevel = 'RT';
    } else if (user.role === 'RW_ADMIN') {
      updateData.verifiedByLevel = 'RW';
    }

    if (data.status === 'REJECTED') {
      updateData.rejectionReason = data.rejectionReason;
    }

    if (data.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (data.resultFileUrl) {
        updateData.resultFileUrl = data.resultFileUrl;
      }

      // Generate PDF Otomatis jika belum ada URL
      if (!updateData.resultFileUrl) {
        try {
          const fullData = await this.prisma.serviceRequest.findUnique({
            where: { id: id },
            include: {
              serviceType: { include: { village: true } },
              applicant: true // 👈 Tambahkan ini untuk mengambil data email warga
            }
          });

          if (fullData) {
            const pdfUrl = await this.pdfService.generateLetterPdf(fullData);
            updateData.resultFileUrl = pdfUrl;

            // ✅ KIRIM EMAIL KE WARGA
            if (fullData.applicant?.email) {
              try {
                await this.mailService.sendServiceCompletedEmail(
                  fullData.applicant.email,
                  fullData.applicantName,
                  fullData.requestNumber,
                  fullData.serviceType.name,
                  pdfUrl
                );
                console.log(`Email surat selesai terkirim ke ${fullData.applicant.email}`);
              } catch (emailError) {
                console.error('Gagal mengirim email surat selesai:', emailError);
              }
            }
          }
        } catch (error) {
          console.error('Gagal generate PDF:', error);
        }
      }
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: { serviceType: true },
    });

    // Log status change
    await this.prisma.serviceStatusLog.create({
      data: {
        requestId: id,
        status: data.status,
        notes: data.notes,
        changedById: user.id,
      },
    });

    return updated;
  }

  async deleteRequest(id: string, user: any) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, deletedAt: null },
    });

    if (!request) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    if (user.role === 'CITIZEN') {
      if (request.applicantId !== user.id) {
        throw new ForbiddenException('Anda tidak memiliki akses ke pengajuan ini');
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestException('Hanya pengajuan PENDING yang bisa dihapus');
      }
    }

    return this.prisma.serviceRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(user: any) {
    const where: any = { deletedAt: null };

    if (user.role === 'CITIZEN') {
      where.applicantId = user.id;
    } else if (user.role === 'VILLAGE_ADMIN') {
      if (user.villageId) {
        where.serviceType = { villageId: user.villageId };
      }
    }

    const [total, pending, verified, approved, rejected, completed] = await Promise.all([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.serviceRequest.count({ where: { ...where, status: 'VERIFIED' } }),
      this.prisma.serviceRequest.count({ where: { ...where, status: 'APPROVED' } }),
      this.prisma.serviceRequest.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.serviceRequest.count({ where: { ...where, status: 'COMPLETED' } }),
    ]);

    return { total, pending, verified, approved, rejected, completed };
  }
}
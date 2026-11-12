import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: string) {
    const where: any = { deletedAt: null };
    if (role) {
      where.roles = {
        some: { role: { name: role } },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: { role: true },
        },
        userVillages: {
          include: { village: { select: { id: true, name: true } } },
        },
        managedRt: true,
        managedRw: true,
      },
    });

    // Sanitize - hapus passwordHash
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      role: user.roles[0]?.role.name || null,
      village: user.userVillages[0]?.village || null,
      managedRt: user.managedRt ? `RT ${user.managedRt.number}` : null,
      managedRw: user.managedRw ? `RW ${user.managedRw.number}` : null,
      createdAt: user.createdAt,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: { include: { role: true } },
        userVillages: { include: { village: true } },
        managedRt: true,
        managedRw: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      isActive: user.isActive,
      isVerified: user.isVerified,
      role: user.roles[0]?.role.name || null,
      villages: user.userVillages.map((uv) => uv.village),
      managedRt: user.managedRt,
      managedRw: user.managedRw,
      createdAt: user.createdAt,
    };
  }

  async create(data: CreateUserDto & { rtNumber?: string; rwNumber?: string; villageId?: string }) {
    // Cek duplikat email
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const roleName = data.role || 'CITIZEN';

    let managedRtId: string | null = null;
    let managedRwId: string | null = null;

    // LOGIKA KHUSUS UNTUK RT & RW
    if (roleName === 'RT_ADMIN' || roleName === 'RW_ADMIN') {
      if (!data.villageId) {
        throw new BadRequestException('Village ID wajib diisi untuk membuat akun RT/RW');
      }

      if (roleName === 'RW_ADMIN') {
        if (!data.rwNumber) throw new BadRequestException('Nomor RW wajib diisi');
        
        // Cari atau buat RW baru
        let rw = await this.prisma.rw.findFirst({
          where: { villageId: data.villageId, number: data.rwNumber }
        });
        if (!rw) {
          rw = await this.prisma.rw.create({
            data: { villageId: data.villageId, number: data.rwNumber }
          });
        }
        managedRwId = rw.id;
      }

      if (roleName === 'RT_ADMIN') {
        if (!data.rtNumber || !data.rwNumber) {
          throw new BadRequestException('Nomor RT dan RW wajib diisi');
        }

        // Cari atau buat RW terlebih dahulu
        let rw = await this.prisma.rw.findFirst({
          where: { villageId: data.villageId, number: data.rwNumber }
        });
        if (!rw) {
          rw = await this.prisma.rw.create({
            data: { villageId: data.villageId, number: data.rwNumber }
          });
        }

        // Cari atau buat RT
        let rt = await this.prisma.rt.findFirst({
          where: { rwId: rw.id, number: data.rtNumber }
        });
        if (!rt) {
          rt = await this.prisma.rt.create({
            data: { rwId: rw.id, number: data.rtNumber }
          });
        }
        managedRtId = rt.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        isActive: data.isActive ?? true,
        isVerified: true,
        isEmailVerified: true, // ✅ Set true karena dibuatkan langsung oleh admin
        managedRtId,
        managedRwId,
        roles: {
          create: {
            role: { connect: { name: roleName as any } },
          },
        },
        // Jika role citizen, masukkan ke village
        userVillages: roleName === 'CITIZEN' && data.villageId ? {
          create: { villageId: data.villageId, isPrimary: true }
        } : undefined,
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roles[0]?.role.name,
      managedRtId: user.managedRtId,
      managedRwId: user.managedRwId,
    };
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id);

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        isActive: data.isActive,
        isVerified: data.isVerified,
        rtId: data.rtId,
        rwId: data.rwId,
      },
    });

    // Update role jika ada
    if (data.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: data.role as any },
      });

      if (role) {
        // Hapus role lama
        await this.prisma.userRole.deleteMany({ where: { userId: id } });
        // Tambah role baru
        await this.prisma.userRole.create({
          data: { userId: id, roleId: role.id },
        });
      }
    }

    return this.findOne(id);
  }

  async changePassword(id: string, data: ChangePasswordDto) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { message: 'Password berhasil diubah' };
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats() {
    const [total, superAdmin, villageAdmin, rtAdmin, rwAdmin, citizen, active] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: 'SUPER_ADMIN' } } } } }),
      this.prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: 'VILLAGE_ADMIN' } } } } }),
      this.prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: 'RT_ADMIN' } } } } }),
      this.prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: 'RW_ADMIN' } } } } }),
      this.prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: 'CITIZEN' } } } } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true } }),
    ]);

    return { total, superAdmin, villageAdmin, rtAdmin, rwAdmin, citizen, active };
  }

  async findWargaByRt(userId: string) {
    const admin = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { managedRtId: true },
    });

    if (!admin || !admin.managedRtId) {
      return [];
    }

    const warga = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        rtId: admin.managedRtId,
        roles: {
          some: {
            role: {
              name: 'CITIZEN',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return warga.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      address: null,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }
}
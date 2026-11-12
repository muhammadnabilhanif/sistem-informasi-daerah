import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProvinceDto, UpdateProvinceDto } from './dto/province.dto';
import { CreateRegencyDto, UpdateRegencyDto } from './dto/regency.dto';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/district.dto';
import { CreateVillageDto, UpdateVillageDto } from './dto/village.dto';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) { }

  // ==================== PROVINCE ====================

  async createProvince(data: CreateProvinceDto) {
    // Cek duplikat code
    const existing = await this.prisma.province.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Provinsi dengan kode ${data.code} sudah ada`);
    }

    return this.prisma.province.create({
      data: {
        code: data.code,
        name: data.name,
        capital: data.capital,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllProvinces() {
    return this.prisma.province.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { regencies: true },
        },
      },
    });
  }

  async findProvinceById(id: string) {
    const province = await this.prisma.province.findFirst({
      where: { id, deletedAt: null },
      include: {
        regencies: {
          where: { deletedAt: null },
          include: {
            districts: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!province) {
      throw new NotFoundException(`Provinsi dengan ID ${id} tidak ditemukan`);
    }

    return province;
  }

  async updateProvince(id: string, data: UpdateProvinceDto) {
    await this.findProvinceById(id);

    // Cek duplikat code jika diubah
    if (data.code) {
      const existing = await this.prisma.province.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Provinsi dengan kode ${data.code} sudah ada`);
      }
    }

    return this.prisma.province.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        capital: data.capital,
        isActive: data.isActive,
      },
    });
  }

  async deleteProvince(id: string) {
    await this.findProvinceById(id);

    // Cek apakah ada regencies yang terkait
    const regencies = await this.prisma.regency.findMany({
      where: { provinceId: id, deletedAt: null },
    });

    if (regencies.length > 0) {
      throw new ConflictException(
        `Provinsi ini memiliki ${regencies.length} kabupaten/kota yang terkait. Hapus kabupaten/kota terlebih dahulu.`
      );
    }

    // Soft delete
    return this.prisma.province.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== REGENCY ====================

  async createRegency(data: CreateRegencyDto) {
    // Cek provinsi
    await this.findProvinceById(data.provinceId);

    // Cek duplikat code
    const existing = await this.prisma.regency.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Kabupaten dengan kode ${data.code} sudah ada`);
    }

    return this.prisma.regency.create({
      data: {
        code: data.code,
        name: data.name,
        capital: data.capital,
        provinceId: data.provinceId,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllRegencies(provinceId?: string) {
    const where: any = { deletedAt: null };
    if (provinceId) {
      where.provinceId = provinceId;
    }

    return this.prisma.regency.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        province: true,
        _count: {
          select: { districts: true },
        },
      },
    });
  }

  async findRegencyById(id: string) {
    const regency = await this.prisma.regency.findFirst({
      where: { id, deletedAt: null },
      include: {
        province: true,
        districts: {
          where: { deletedAt: null },
        },
      },
    });

    if (!regency) {
      throw new NotFoundException(`Kabupaten dengan ID ${id} tidak ditemukan`);
    }

    return regency;
  }

  async updateRegency(id: string, data: UpdateRegencyDto) {
    await this.findRegencyById(id);

    if (data.code) {
      const existing = await this.prisma.regency.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Kabupaten dengan kode ${data.code} sudah ada`);
      }
    }

    if (data.provinceId) {
      await this.findProvinceById(data.provinceId);
    }

    return this.prisma.regency.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        capital: data.capital,
        provinceId: data.provinceId,
        isActive: data.isActive,
      },
    });
  }

  async deleteRegency(id: string) {
    await this.findRegencyById(id);

    const districts = await this.prisma.district.findMany({
      where: { regencyId: id, deletedAt: null },
    });

    if (districts.length > 0) {
      throw new ConflictException(
        `Kabupaten ini memiliki ${districts.length} kecamatan yang terkait. Hapus kecamatan terlebih dahulu.`
      );
    }

    return this.prisma.regency.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== DISTRICT ====================

  async createDistrict(data: CreateDistrictDto) {
    await this.findRegencyById(data.regencyId);

    const existing = await this.prisma.district.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Kecamatan dengan kode ${data.code} sudah ada`);
    }

    return this.prisma.district.create({
      data: {
        code: data.code,
        name: data.name,
        regencyId: data.regencyId,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllDistricts(regencyId?: string) {
    const where: any = { deletedAt: null };
    if (regencyId) {
      where.regencyId = regencyId;
    }

    return this.prisma.district.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        regency: true,
        _count: {
          select: { villages: true },
        },
      },
    });
  }

  async findDistrictById(id: string) {
    const district = await this.prisma.district.findFirst({
      where: { id, deletedAt: null },
      include: {
        regency: true,
        villages: {
          where: { deletedAt: null },
        },
      },
    });

    if (!district) {
      throw new NotFoundException(`Kecamatan dengan ID ${id} tidak ditemukan`);
    }

    return district;
  }

  async updateDistrict(id: string, data: UpdateDistrictDto) {
    await this.findDistrictById(id);

    if (data.code) {
      const existing = await this.prisma.district.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Kecamatan dengan kode ${data.code} sudah ada`);
      }
    }

    if (data.regencyId) {
      await this.findRegencyById(data.regencyId);
    }

    return this.prisma.district.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        regencyId: data.regencyId,
        isActive: data.isActive,
      },
    });
  }

  async deleteDistrict(id: string) {
    await this.findDistrictById(id);

    const villages = await this.prisma.village.findMany({
      where: { districtId: id, deletedAt: null },
    });

    if (villages.length > 0) {
      throw new ConflictException(
        `Kecamatan ini memiliki ${villages.length} desa yang terkait. Hapus desa terlebih dahulu.`
      );
    }

    return this.prisma.district.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== VILLAGE ====================

  async createVillage(data: CreateVillageDto) {
    await this.findDistrictById(data.districtId);

    const existing = await this.prisma.village.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`Desa dengan kode ${data.code} sudah ada`);
    }

    return this.prisma.village.create({
      data: {
        code: data.code,
        name: data.name,
        districtId: data.districtId,
        isActive: data.isActive ?? true,
      },
    });
  }

  async findAllVillages(districtId?: string) {
    const where: any = { deletedAt: null };
    if (districtId) {
      where.districtId = districtId;
    }

    return this.prisma.village.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        district: {
          include: {
            regency: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });
  }

  async findVillageById(id: string) {
    const village = await this.prisma.village.findFirst({
      where: { id, deletedAt: null },
      include: {
        district: {
          include: {
            regency: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    if (!village) {
      throw new NotFoundException(`Desa dengan ID ${id} tidak ditemukan`);
    }

    return village;
  }

  async updateVillage(id: string, data: UpdateVillageDto) {
    await this.findVillageById(id);

    if (data.code) {
      const existing = await this.prisma.village.findUnique({
        where: { code: data.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Desa dengan kode ${data.code} sudah ada`);
      }
    }

    if (data.districtId) {
      await this.findDistrictById(data.districtId);
    }

    return this.prisma.village.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        districtId: data.districtId,
        isActive: data.isActive,
      },
    });
  }

  async deleteVillage(id: string) {
    await this.findVillageById(id);
    return this.prisma.village.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

    async findAllRws() {
    return this.prisma.rw.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async findAllRts(rwId?: string) {
    return this.prisma.rt.findMany({
      where: rwId ? { rwId } : {},
      orderBy: { number: 'asc' },
    });
  }
}
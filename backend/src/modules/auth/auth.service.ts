import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogsService: AuditLogsService,
    private mailService: MailService,
  ) {}

  // ============================================
  // REGISTER
  // ============================================
  async register(registerDto: RegisterDto) {
    const { email, password, name, phone } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const citizenRole = await this.prisma.role.findUnique({
      where: { name: 'CITIZEN' },
    });
    if (!citizenRole) {
      this.logger.error('Role CITIZEN tidak ditemukan di database!');
      throw new Error('Role CITIZEN tidak ditemukan. Jalankan seeder dulu.');
    }

    const defaultVillage = await this.prisma.village.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!defaultVillage) {
      throw new NotFoundException(
        'Tidak ada desa tersedia. Hubungi admin untuk setup desa terlebih dahulu.',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); 

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          phone,
          isVerified: true,
          isActive: true,
          isEmailVerified: false,
          verificationCode: otpCode,
          otpExpiresAt: otpExpiresAt,
          roles: {
            create: {
              role: { connect: { name: 'CITIZEN' } },
            },
          },
          userVillages: {
            create: {
              villageId: defaultVillage.id,
              isPrimary: true,
            },
          },
        },
        include: {
          roles: { include: { role: true } },
          userVillages: { include: { village: true } },
        },
      });

      return newUser;
    });

    const userVillage = user.userVillages[0];
    const villageId = userVillage?.villageId || null;

    this.logger.log(
      `✅ User registered: ${user.email} (auto-assign ke "${defaultVillage.name}")`,
    );

    try {
      await this.mailService.sendVerificationCode(email, name, otpCode);
      this.logger.log(`📧 OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Gagal mengirim email OTP ke ${email}`, error);
    }

    await this.auditLogsService.create({
      action: 'REGISTER',
      resource: 'auth',
      description: `User ${user.email} register berhasil, menunggu verifikasi OTP`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: 'CITIZEN',
      villageId: villageId || undefined,
      statusCode: 201,
    });

    return {
      message: 'Registrasi berhasil. Silakan cek email Anda untuk kode OTP.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.roles[0]?.role.name || 'CITIZEN',
        villageId,
      },
    };
  }

  // ============================================
  // VERIFY OTP
  // ============================================
  async verifyOtp(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        userVillages: { include: { village: true } },
      },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah diverifikasi sebelumnya');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Kode OTP salah');
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Kode OTP sudah kedaluwarsa. Silakan minta kode baru.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        otpExpiresAt: null,
      },
    });

    const userVillage = user.userVillages[0];
    const villageId = userVillage?.villageId || null;

    // ✅ Ambil rtId dan rwId jika ada (biasanya kosong untuk warga baru)
    const rtId = user.managedRtId || null;
    const rwId = user.managedRwId || null;

    const token = this.generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: user.roles[0]?.role.name || 'CITIZEN',
      villageId,
      rtId,
      rwId,
    });

    return {
      message: 'Verifikasi email berhasil',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: user.roles[0]?.role.name || 'CITIZEN',
        villageId,
        rtId,
        rwId,
      },
      token,
    };
  }

  // ============================================
  // RESEND OTP
  // ============================================
  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email tidak terdaftar');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email sudah diverifikasi. Silakan langsung login.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otpCode,
        otpExpiresAt: otpExpiresAt,
      },
    });

    try {
      await this.mailService.sendVerificationCode(user.email, user.name, otpCode);
      this.logger.log(`📧 OTP resent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Gagal mengirim ulang OTP ke ${email}`, error);
      throw new BadRequestException('Gagal mengirim email. Coba lagi nanti.');
    }

    return {
      message: 'Kode OTP baru telah dikirim ke email Anda.',
    };
  }

  // ============================================
  // LOGIN 
  // ============================================
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: { include: { role: true } },
        userVillages: { include: { village: true } },
      },
    });

    if (!user) {
      await this.auditLogsService.create({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        description: `Login gagal: email ${email} tidak ditemukan`,
        statusCode: 401,
      });
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditLogsService.create({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        description: `Login gagal: password salah untuk ${email}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        statusCode: 401,
      });
      throw new UnauthorizedException('Email atau password salah');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.');
    }

    const userVillage = user.userVillages[0];
    const villageId = userVillage?.villageId || null;

    // ✅ Ambil rtId dan rwId untuk dimasukkan ke Token
    const rtId = user.managedRtId || null;
    const rwId = user.managedRwId || null;

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.roles[0]?.role.name || 'CITIZEN',
      villageId,
      rtId,
      rwId,
    });

    await this.auditLogsService.create({
      action: 'LOGIN',
      resource: 'auth',
      description: `User ${user.email} login berhasil`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.roles[0]?.role.name || 'CITIZEN',
      villageId: villageId || undefined,
      statusCode: 200,
    });

    return {
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.roles[0]?.role.name || 'CITIZEN',
        villageId,
        rtId, // ✅ Tambahkan ini
        rwId, // ✅ Tambahkan ini
      },
      token,
    };
  }

  // ============================================
  // GENERATE TOKEN
  // ============================================
  private generateToken(payload: {
    id: string;
    email: string;
    role: string;
    villageId: string | null;
    rtId?: string | null; // ✅ Tambahan
    rwId?: string | null; // ✅ Tambahan
  }) {
    return this.jwtService.sign({
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      villageId: payload.villageId,
      rtId: payload.rtId, // ✅ Masukkan ke JWT
      rwId: payload.rwId, // ✅ Masukkan ke JWT
    });
  }

  // ============================================
  // GET PROFILE
  // ============================================
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        userVillages: { include: { village: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const userVillage = user.userVillages[0];
    const villageId = userVillage?.villageId || null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.roles[0]?.role.name || 'CITIZEN',
      villageId,
      rtId: user.managedRtId || null, // ✅ Tambahan
      rwId: user.managedRwId || null, // ✅ Tambahan
      villages: user.userVillages.map((uv) => uv.village),
    };
  }
}
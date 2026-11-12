import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode, // ✅ Tambahkan ini
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipRegionScope } from '../../common/decorators/skip-region-scope.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @SkipRegionScope()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3x per menit
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // ✅ ENDPOINT BARU: Verifikasi OTP
  @Post('verify-otp')
  @SkipRegionScope()
  @HttpCode(200) // Mengembalikan status 200 OK (default POST adalah 201)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Batasi 5x percobaan per menit
  async verifyOtp(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOtp(body.email, body.code);
  }

  @Post('resend-otp')
  @SkipRegionScope()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Batasi maksimal 3x per menit
  async resendOtp(@Body() body: { email: string }) {
    return this.authService.resendOtp(body.email);
  }

  @Post('login')
  @SkipRegionScope()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5x per menit
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @SkipRegionScope()
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }
}
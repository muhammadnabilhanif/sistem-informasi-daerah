import { IsString, IsEmail, IsNotEmpty, IsOptional, IsBoolean, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // ✅ TAMBAHAN: Field Gender
  @IsString()
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'], { message: 'Gender harus MALE atau FEMALE' })
  gender?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['SUPER_ADMIN', 'VILLAGE_ADMIN', 'CITIZEN', 'RT_ADMIN', 'RW_ADMIN'])
  role?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  rtNumber?: string;

  @IsString()
  @IsOptional()
  rwNumber?: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // ✅ TAMBAHAN: Field Gender
  @IsString()
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'], { message: 'Gender harus MALE atau FEMALE' })
  gender?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['SUPER_ADMIN', 'VILLAGE_ADMIN', 'CITIZEN', 'RT_ADMIN', 'RW_ADMIN'])
  role?: string;

  @IsString()
  @IsOptional()
  rtId?: string;

  @IsString()
  @IsOptional()
  rwId?: string; 

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  newPassword: string;
}
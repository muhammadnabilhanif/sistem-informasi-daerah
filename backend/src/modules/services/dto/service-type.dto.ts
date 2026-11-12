import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateServiceTypeDto {
  @IsString()
  @IsNotEmpty()
  villageId: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama layanan wajib diisi' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Kode layanan wajib diisi' })
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  requirements?: string[];

  @IsString()
  @IsOptional()
  template?: string;

  @IsNumber()
  @IsOptional()
  processingDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}

export class UpdateServiceTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  requirements?: string[];

  @IsString()
  @IsOptional()
  template?: string;

  @IsNumber()
  @IsOptional()
  processingDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;
}
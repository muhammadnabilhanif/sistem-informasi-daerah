import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateRegencyDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode kabupaten wajib diisi' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama kabupaten wajib diisi' })
  name: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Provinsi ID wajib diisi' })
  provinceId: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRegencyDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsUUID()
  @IsOptional()
  provinceId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateVillageDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode desa wajib diisi' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama desa wajib diisi' })
  name: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Kecamatan ID wajib diisi' })
  districtId: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateVillageDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  districtId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode kecamatan wajib diisi' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama kecamatan wajib diisi' })
  name: string;

  @IsUUID()
  @IsNotEmpty({ message: 'Kabupaten ID wajib diisi' })
  regencyId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDistrictDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  regencyId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
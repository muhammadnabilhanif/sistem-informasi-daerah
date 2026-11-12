import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateProvinceDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode provinsi wajib diisi' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama provinsi wajib diisi' })
  name: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateProvinceDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
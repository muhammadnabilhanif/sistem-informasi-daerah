import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsDateString, IsEnum } from 'class-validator';

export class CreateAnnouncementDto {
  @IsUUID()
  @IsNotEmpty()
  villageId: string;

  @IsString()
  @IsNotEmpty({ message: 'Judul wajib diisi' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Isi pengumuman wajib diisi' })
  content: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateAnnouncementDto extends CreateAnnouncementDto {}
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsDateString } from 'class-validator';

export class CreateNewsDto {
  @IsUUID()
  @IsNotEmpty()
  villageId: string;

  @IsString()
  @IsNotEmpty({ message: 'Judul wajib diisi' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Isi berita wajib diisi' })
  content: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateNewsDto extends CreateNewsDto {}
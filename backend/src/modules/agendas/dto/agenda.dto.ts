import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsDateString, IsNumber, IsEnum } from 'class-validator';

export class CreateAgendaDto {
  @IsUUID()
  @IsNotEmpty()
  villageId: string;

  @IsString()
  @IsNotEmpty({ message: 'Judul agenda wajib diisi' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsDateString()
  @IsNotEmpty({ message: 'Tanggal mulai wajib diisi' })
  startDatetime: string;

  @IsDateString()
  @IsOptional()
  endDatetime?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateAgendaDto {
  @IsUUID()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsDateString()
  @IsOptional()
  startDatetime?: string;

  @IsDateString()
  @IsOptional()
  endDatetime?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  organizer?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
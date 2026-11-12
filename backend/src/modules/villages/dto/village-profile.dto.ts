import { IsString, IsOptional, IsNumber, IsUUID, IsEnum } from 'class-validator';

export class CreateVillageProfileDto {
  @IsUUID()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  vision?: string;

  @IsString()
  @IsOptional()
  mission?: string;

  @IsString()
  @IsOptional()
  motto?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  totalAreaKm2?: number;

  @IsNumber()
  @IsOptional()
  landAreaKm2?: number;

  @IsNumber()
  @IsOptional()
  waterAreaKm2?: number;

  @IsString()
  @IsOptional()
  northBoundary?: string;

  @IsString()
  @IsOptional()
  southBoundary?: string;

  @IsString()
  @IsOptional()
  westBoundary?: string;

  @IsString()
  @IsOptional()
  eastBoundary?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;
}

export class UpdateVillageProfileDto {
  @IsUUID()
  @IsOptional()
  villageId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  vision?: string;

  @IsString()
  @IsOptional()
  mission?: string;

  @IsString()
  @IsOptional()
  motto?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  totalAreaKm2?: number;

  @IsNumber()
  @IsOptional()
  landAreaKm2?: number;

  @IsNumber()
  @IsOptional()
  waterAreaKm2?: number;

  @IsString()
  @IsOptional()
  northBoundary?: string;

  @IsString()
  @IsOptional()
  southBoundary?: string;

  @IsString()
  @IsOptional()
  westBoundary?: string;

  @IsString()
  @IsOptional()
  eastBoundary?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;
}
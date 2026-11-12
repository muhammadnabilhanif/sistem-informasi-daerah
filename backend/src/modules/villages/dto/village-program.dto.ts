import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, IsDateString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateVillageProgramDto {
  @IsUUID()
  @IsNotEmpty()
  villageId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['PLANNING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateVillageProgramDto {
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
  category?: string;

  @IsNumber()
  @IsOptional()
  budget?: number;

  @IsString()
  @IsOptional()
  @IsEnum(['PLANNING', 'ONGOING', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
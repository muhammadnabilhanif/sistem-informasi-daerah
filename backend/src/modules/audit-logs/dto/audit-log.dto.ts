import { IsString, IsOptional, IsUUID, IsNumber, IsObject } from 'class-validator';

export class CreateAuditLogDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsString()
  @IsOptional()
  userEmail?: string;

  @IsString()
  @IsOptional()
  userRole?: string;

  @IsUUID()
  @IsOptional()
  villageId?: string;

  @IsString()
  action: string;

  @IsString()
  resource: string;

  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  oldValues?: any;

  @IsObject()
  @IsOptional()
  newValues?: any;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsNumber()
  @IsOptional()
  durationMs?: number;
}
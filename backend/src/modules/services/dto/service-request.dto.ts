import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  serviceTypeId: string;

  @IsString()
  @IsNotEmpty({ message: 'Keperluan wajib diisi' })
  purpose: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];

  @IsString()
  @IsOptional()
  applicantNik?: string;

  @IsString()
  @IsOptional()
  applicantPhone?: string;

  @IsString()
  @IsOptional()
  applicantAddress?: string;
}

export class UpdateServiceRequestStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'COMPLETED'])
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  resultFileUrl?: string;
}
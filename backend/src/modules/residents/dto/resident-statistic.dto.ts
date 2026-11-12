import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsObject } from 'class-validator';

export class CreateResidentStatisticDto {
  @IsUUID()
  @IsNotEmpty()
  villageId: string;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsOptional()
  semester?: number;

  @IsNumber()
  @IsOptional()
  totalPopulation?: number;

  @IsNumber()
  @IsOptional()
  maleCount?: number;

  @IsNumber()
  @IsOptional()
  femaleCount?: number;

  @IsNumber()
  @IsOptional()
  totalHouseholds?: number;

  @IsNumber()
  @IsOptional()
  totalFamilies?: number;

  @IsObject()
  @IsOptional()
  ageGroups?: any;

  @IsObject()
  @IsOptional()
  educationStats?: any;

  @IsObject()
  @IsOptional()
  occupationStats?: any;

  @IsObject()
  @IsOptional()
  religionStats?: any;

  @IsString()
  @IsOptional()
  dataSource?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateResidentStatisticDto extends CreateResidentStatisticDto {}
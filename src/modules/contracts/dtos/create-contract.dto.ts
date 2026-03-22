import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MilestoneDto {
  @IsString()
  readonly title: string;

  @IsString()
  readonly description: string;

  @IsString()
  @IsOptional()
  readonly id?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  readonly progress?: number;

  @IsEnum(['pending', 'in-progress', 'completed'])
  @IsOptional()
  readonly status?: 'pending' | 'in-progress' | 'completed';

  @IsDateString()
  readonly startDate: string;

  @IsDateString()
  readonly endDate: string;

  @IsDateString()
  @IsOptional()
  readonly completedDate?: string;

  @IsNumber()
  @Min(0)
  readonly payment: number;
}

export class LandRentalDto {
  @IsString()
  readonly id: string;

  @IsString()
  readonly landArea: string;

  @IsString()
  readonly month: string;

  @IsDateString()
  readonly dueDate: string;

  @IsDateString()
  @IsOptional()
  readonly paidDate?: string;

  @IsNumber()
  @Min(0)
  readonly amount: number;

  @IsEnum(['pending', 'paid', 'overdue'])
  readonly status: 'pending' | 'paid' | 'overdue';
}

export class FinancialBreakdownDto {
  @IsString()
  readonly category: string;

  @IsNumber()
  @Min(0)
  readonly amount: number;
}

export class CreateContractDto {
  @IsString()
  @IsEnum(['investor-harvest-base', 'land-owner-ad', 'investor-sponsorship'])
  readonly type:
    | 'investor-harvest-base'
    | 'land-owner-ad'
    | 'investor-sponsorship';

  @IsMongoId()
  readonly offer: string;

  @ValidateIf((dto: CreateContractDto) => dto.type === 'land-owner-ad')
  @IsMongoId()
  readonly landAd?: string;

  @IsMongoId()
  @IsOptional()
  readonly investor?: string;

  @ValidateIf((dto: CreateContractDto) => dto.type !== 'land-owner-ad')
  @IsMongoId()
  readonly farmer?: string;

  @ValidateIf((dto: CreateContractDto) => dto.type === 'land-owner-ad')
  @IsMongoId()
  readonly landowner?: string;

  @IsString()
  @IsOptional()
  readonly projectName?: string;

  @IsString()
  @IsOptional()
  readonly cropType?: string;

  @IsString()
  @IsOptional()
  readonly cropIcon?: string;

  @IsString()
  @IsOptional()
  readonly location?: string;

  @IsString()
  @IsOptional()
  readonly district?: string;

  @IsString()
  @IsOptional()
  readonly province?: string;

  @IsString()
  @IsOptional()
  readonly coordinates?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  readonly expectedROI?: number;

  @IsEnum(['active', 'inactive', 'completed', 'terminated'])
  @IsOptional()
  readonly status?: 'active' | 'inactive' | 'completed' | 'terminated';

  @IsEnum(['harvest', 'commission'])
  @IsOptional()
  readonly investmentType?: 'harvest' | 'commission';

  @IsDateString()
  @IsOptional()
  readonly startDate?: string;

  @IsDateString()
  @IsOptional()
  readonly endDate?: string;

  @IsString()
  @IsOptional()
  readonly backgroundImage?: string;

  @IsString()
  @IsOptional()
  readonly investorName?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly investorAmount?: number;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  @IsOptional()
  readonly riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsOptional()
  readonly riskStatus?: string;

  @ValidateIf((dto: CreateContractDto) => dto.type === 'investor-harvest-base')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  @ArrayMinSize(1)
  readonly milestones?: MilestoneDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandRentalDto)
  @IsOptional()
  readonly landRentals?: LandRentalDto[];

  @ValidateIf((dto: CreateContractDto) => dto.type === 'investor-harvest-base')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FinancialBreakdownDto)
  @ArrayMinSize(1)
  readonly financialBreakdown?: FinancialBreakdownDto[];
}

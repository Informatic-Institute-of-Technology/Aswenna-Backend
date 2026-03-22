import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import {
  ContractCreateI,
  MilestoneI,
  LandRentalI,
  FinancialBreakdownI,
} from '../contracts.types';

export class CreateContractDto implements ContractCreateI {
  @IsEnum(['investor-harvest-base', 'land-owner-ad', 'investor-sponsorship'])
  type: 'investor-harvest-base' | 'land-owner-ad' | 'investor-sponsorship';

  @IsMongoId()
  offer: string;

  @IsOptional()
  @IsMongoId()
  landAd?: string;

  @IsOptional()
  @IsMongoId()
  investor?: string;

  @IsOptional()
  @IsMongoId()
  farmer?: string;

  @IsOptional()
  @IsMongoId()
  landowner?: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  cropType?: string;

  @IsOptional()
  @IsString()
  cropIcon?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  coordinates?: string;

  @IsOptional()
  @IsNumber()
  expectedROI?: number;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'completed', 'terminated'])
  status?: 'active' | 'inactive' | 'completed' | 'terminated';

  @IsOptional()
  @IsEnum(['harvest', 'commission'])
  investmentType?: 'harvest' | 'commission';

  @IsOptional()
  startDate?: Date | string;

  @IsOptional()
  endDate?: Date | string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  investorName?: string;

  @IsOptional()
  @IsNumber()
  investorAmount?: number;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsOptional()
  @IsString()
  riskStatus?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  milestones?: MilestoneI[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  landRentals?: LandRentalI[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  financialBreakdown?: FinancialBreakdownI[];
}

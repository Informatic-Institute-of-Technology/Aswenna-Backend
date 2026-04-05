import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JourneyStepStatus } from '../schemas/request.schema';

export class UpdateJourneyStepDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsEnum(JourneyStepStatus)
  status?: JourneyStepStatus;

  @IsOptional()
  @IsString()
  icon?: string;
}

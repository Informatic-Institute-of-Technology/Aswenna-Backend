import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { AgreementType } from '../schemas/offer.schema';

export class OfferCreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  readonly projectName: string;

  @IsString()
  @IsNotEmpty()
  readonly cropType: string;

  @IsDateString()
  @IsNotEmpty()
  readonly effectiveDateFrom: string;

  @IsDateString()
  @IsNotEmpty()
  readonly effectiveDateTo: string;

  @IsString()
  @IsNotEmpty()
  readonly location: string;

  @IsArray()
  @IsString({ each: true })
  readonly farmingMethods: string[];

  @IsEnum(AgreementType)
  @IsNotEmpty()
  readonly agreementType: AgreementType;
}

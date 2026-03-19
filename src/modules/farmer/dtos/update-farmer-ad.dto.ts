import { PartialType } from '@nestjs/mapped-types';
import { CreateFarmerAdDto } from './create-farmer-ad.dto';

export class UpdateFarmerAdDto extends PartialType(CreateFarmerAdDto) {}
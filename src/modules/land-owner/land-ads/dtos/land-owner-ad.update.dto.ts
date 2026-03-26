import { PartialType } from '@nestjs/mapped-types';
import { CreateLandOwnerAdDto } from './land-owner-ad.create.dto';

export class UpdateLandOwnerAdDto extends PartialType(CreateLandOwnerAdDto) {}

import { Types } from 'mongoose';
import { CreateLandOwnerAdDto } from './dtos/land-owner-ad.create.dto';
import { LandOwnerAdStatus } from './schemas/land-owner-ad.schema';

export interface LandOwnerAdCreatePayload {
  landowner: Types.ObjectId;
  title: string;
  location: string;
  landArea: number;
  rentalAmount: number;
  availableFrom: Date;
  availableTo: Date;
  soilType: string;
  landHistory?: string;
  additionalInfo: string;
  image: CreateLandOwnerAdDto['image'];
  status: LandOwnerAdStatus;
}

export interface LandOwnerAdUpdatePayload {
  title?: string;
  location?: string;
  landArea?: number;
  rentalAmount?: number;
  availableFrom?: Date;
  availableTo?: Date;
  soilType?: string;
  landHistory?: string;
  additionalInfo?: string;
  image?: CreateLandOwnerAdDto['image'];
}

export interface UserRoleReference {
  name?: string;
}

export type LandOwnerAdSortOptions = Record<string, 1 | -1>;

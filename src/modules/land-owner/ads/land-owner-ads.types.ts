import { Types } from 'mongoose';
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
  image?: UploadedLandImage;
}

export interface UserRoleReference {
  name?: string;
}

export type LandOwnerAdSortOptions = Record<string, 1 | -1>;

export interface UploadedLandImage {
  filename: string;
  fileSize: string;
  mimeType: string;
  url?: string;
}

import { FarmingMethod, OfferStatus, OfferType } from './schemas/offer.schema';

export interface HarvestBaseDetailsType {
  projectTitle: string;
  cropType: string;
  cropVariety: string;
  requiredQuantity: number;
  quantityUnit: string;
  pricePerUnit: number;
  deliveryLocation: string;
  totalBudget: number;
  companyName: string;
  preferredRegion: string[];
}

export interface CommissionDetailsType {
  sponsorshipTitle: string;
  cropTypes: string[];
  startDate: string;
  endDate: string;
  preferredFarmingMethod: FarmingMethod;
  minimumInvestment: number;
  maximumInvestment: number;
  commissionRate: number;
  supportType: string[];
  preferredRegions: string[];
}

export interface BaseOfferType {
  offerType: OfferType;
  investorName: string;
  description: string;
  cropIcon: string;
  backgroundImage: string;
  expectedROI: number;
  currency: string;
  expiredDate: string;
  status?: OfferStatus;
  applicationsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DirectHarvestOfferType extends BaseOfferType {
  offerType: OfferType.DIRECT_HARVEST;
  projectTitle: string;
  cropType: string;
  cropVariety: string;
  requiredQuantity: number;
  quantityUnit: string;
  pricePerUnit: number;
  deliveryLocation: string;
  totalBudget: number;
  companyName: string;
  preferredRegion: string[];
  sponsorshipTitle?: never;
  cropTypes?: never;
  startDate?: never;
  endDate?: never;
  preferredFarmingMethod?: never;
  minimumInvestment?: never;
  maximumInvestment?: never;
  commissionRate?: never;
  supportType?: never;
  preferredRegions?: never;
}

export interface SponsorshipOfferType extends BaseOfferType {
  offerType: OfferType.SPONSORSHIP;
  sponsorshipTitle: string;
  cropTypes: string[];
  startDate: string;
  endDate: string;
  preferredFarmingMethod: FarmingMethod;
  minimumInvestment: number;
  maximumInvestment: number;
  commissionRate: number;
  supportType: string[];
  preferredRegions: string[];
  projectTitle?: never;
  cropType?: never;
  cropVariety?: never;
  requiredQuantity?: never;
  quantityUnit?: never;
  pricePerUnit?: never;
  deliveryLocation?: never;
  totalBudget?: never;
  companyName?: never;
  preferredRegion?: never;
}

export type CreateOfferType = DirectHarvestOfferType | SponsorshipOfferType;

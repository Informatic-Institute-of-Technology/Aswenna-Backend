import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { File } from 'src/common/schemas/file.schema';
import { Meta } from 'src/common/schemas/meta.schema';
import { FarmerProject } from 'src/modules/farmer/schemas/farmer-project.schema';
import { LandOwnerAd } from 'src/modules/land-owner/land-ads/schemas/land-owner-ad.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export enum OfferType {
  DIRECT_HARVEST = 'direct-harvest',
  SPONSORSHIP = 'sponsorship',
}

export enum FarmingMethod {
  ORGANIC = 'organic',
  CONVENTIONAL = 'conventional',
  ANY = 'any',
}

export enum OfferStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  OPEN = 'open',
  CLOSED = 'closed',
  EXPIRED = 'expired',
}

@Schema({ _id: false })
export class HarvestBaseDetails {
  @Prop({ required: true })
  projectTitle: string;

  @Prop({ required: true })
  cropType: string;

  @Prop({ required: true })
  cropVariety: string;

  @Prop({ required: true })
  requiredQuantity: number;

  @Prop({ required: true })
  quantityUnit: string;

  @Prop({ required: true })
  pricePerUnit: number;

  @Prop({ required: true })
  deliveryLocation: string;

  @Prop({ required: true })
  totalBudget: number;

  @Prop({ required: true })
  companyName: string;

  @Prop({ type: [String], required: true })
  preferredRegion: string[];
}

@Schema({ _id: false })
export class CommissionDetails {
  @Prop({ required: true })
  sponsorshipTitle: string;

  @Prop({ type: [String], required: true })
  cropTypes: string[];

  @Prop({ required: true, enum: FarmingMethod })
  preferredFarmingMethod: FarmingMethod;

  @Prop({ required: true })
  minimumInvestment: number;

  @Prop({ required: true })
  maximumInvestment: number;

  @Prop({ required: true })
  commissionRate: number;

  @Prop({ type: [String], required: true })
  supportType: string[];

  @Prop({ type: [String], required: true })
  preferredRegions: string[];
}

@Schema({ _id: false })
export class OfferCostBreakdownItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  estimatedCost: number;
}

@Schema({ _id: false })
export class OfferMilestoneBreakdownItem {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  estimatedAmount: number;

  @Prop({ required: true })
  paymentOverDueDate: Date;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;
}

@Schema({ timestamps: true })
export class Offer extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true, enum: OfferType })
  readonly offerType: OfferType;

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  readonly investor: User;

  @Prop({ required: true })
  readonly description: string;

  @Prop({ required: true })
  readonly cropIcon: string;

  @Prop({ required: true })
  readonly backgroundImage: string;

  @Prop({ required: true })
  readonly expectedROI: number;

  @Prop({ required: true })
  readonly currency: string;

  @Prop({ required: true })
  readonly expiredDate: Date;

  @Prop({ required: true, enum: OfferStatus, default: OfferStatus.PENDING })
  readonly status: OfferStatus;

  @Prop({ required: true, default: 0 })
  readonly applicationsCount: number;

  @Prop({ type: Types.ObjectId, ref: User.name })
  readonly farmer?: User;

  @Prop({ type: Types.ObjectId, ref: FarmerProject.name })
  readonly farmerProject?: FarmerProject;

  @Prop(File)
  readonly farmerAgreement?: File;

  @Prop({ type: Types.ObjectId, ref: User.name })
  readonly landowner?: User;

  @Prop({ type: Types.ObjectId, ref: LandOwnerAd.name })
  readonly landownerProject?: LandOwnerAd;

  @Prop(File)
  readonly landownerAgreement?: File;

  @Prop({ type: HarvestBaseDetails })
  readonly harvestBaseDetails?: HarvestBaseDetails;

  @Prop({ type: CommissionDetails })
  readonly commissionDetails?: CommissionDetails;

  @Prop([OfferCostBreakdownItem])
  readonly costBreakdown?: OfferCostBreakdownItem[];

  @Prop([OfferMilestoneBreakdownItem])
  readonly milestoneBreakdown?: OfferMilestoneBreakdownItem[];

  @Prop([Meta])
  readonly meta: Meta[];

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop({ default: 'system' })
  readonly updatedBy: string;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

// OfferSchema.index({ offerType: 1 });
// OfferSchema.index({ createdAt: -1 });
// OfferSchema.index({ offerType: 1, createdAt: -1 });
// OfferSchema.index({
//   investorName: 'text',
//   description: 'text',
//   'harvestBaseDetails.projectTitle': 'text',
//   'harvestBaseDetails.companyName': 'text',
//   'harvestBaseDetails.cropType': 'text',
//   'commissionDetails.sponsorshipTitle': 'text',
// });
// OfferSchema.index({ status: 1, createdAt: -1 });
// OfferSchema.index({ 'harvestBaseDetails.preferredRegion': 1 });
// OfferSchema.index({ 'commissionDetails.preferredRegions': 1 });
// OfferSchema.index({ 'commissionDetails.preferredFarmingMethod': 1 });

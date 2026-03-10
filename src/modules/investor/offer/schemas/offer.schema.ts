import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';

export enum OfferType {
  HARVEST_BASE = 'HARVEST_BASE',
  COMMISSION = 'COMMISSION',
}

export enum FarmingMethod {
  ORGANIC_ONLY = 'ORGANIC_ONLY',
  CONVENTIONAL_ONLY = 'CONVENTIONAL_ONLY',
  ANY = 'ANY',
}

@Schema({ _id: false })
export class RequiredQuantity {
  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;
}

// Common details shared across all offer types
@Schema({ _id: false })
export class CommonOfferDetails {
  @Prop({ required: true })
  projectTitle: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true })
  preferredRegions: string[];
}

// Harvest Base specific details
@Schema({ _id: false })
export class HarvestBaseDetails {
  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  cropName: string;

  @Prop({ required: true })
  cropVariety: string;

  @Prop({ type: RequiredQuantity, required: true })
  requiredQuantity: RequiredQuantity;

  @Prop({ required: true })
  pricePerUnit: number;

  @Prop({ required: true })
  deliveryDeadline: Date;

  @Prop({ required: true })
  deliveryLocation: string;

  @Prop({ required: true })
  qualityStandards: string;

  @Prop({ required: true })
  totalBudget: number;
}

// Commission specific details
@Schema({ _id: false })
export class CommissionDetails {
  @Prop({ required: true, enum: FarmingMethod })
  preferredFarmingMethod: FarmingMethod;

  @Prop({ required: true })
  minimumInvestment: number;

  @Prop({ required: true })
  maximumInvestment: number;

  @Prop({ required: true })
  commissionRate: number;

  @Prop({ type: [String], required: true })
  supportTypes: string[];

  @Prop({ required: true })
  minDuration: number;

  @Prop({ required: true })
  maxDuration: number;
}

// Unified Offer Schema with nested details
@Schema({ timestamps: true })
export class Offer extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true, enum: OfferType })
  readonly offerType: OfferType;

  // Common details for all offer types - flattened directly into Offer
  @Prop({ required: true })
  readonly projectTitle: string;

  @Prop({ required: true })
  readonly description: string;

  @Prop({ type: [String], required: true })
  readonly preferredRegions: string[];

  // Harvest Base specific details (required when offerType === HARVEST_BASE)
  @Prop({ type: HarvestBaseDetails })
  readonly harvestBaseDetails?: HarvestBaseDetails;

  // Commission specific details (required when offerType === COMMISSION)
  @Prop({ type: CommissionDetails })
  readonly commissionDetails?: CommissionDetails;

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

// Add indexes for optimized querying
OfferSchema.index({ offerType: 1 });
OfferSchema.index({
  projectTitle: 'text',
  description: 'text',
});
OfferSchema.index({ createdAt: -1 });
OfferSchema.index({ offerType: 1, createdAt: -1 });
OfferSchema.index({
  'harvestBaseDetails.companyName': 'text',
  'harvestBaseDetails.cropName': 'text',
});
OfferSchema.index({ 'harvestBaseDetails.deliveryDeadline': 1 });
OfferSchema.index({ 'harvestBaseDetails.pricePerUnit': 1 });
OfferSchema.index({ 'commissionDetails.preferredFarmingMethod': 1 });
OfferSchema.index({
  'commissionDetails.minimumInvestment': 1,
  'commissionDetails.maximumInvestment': 1,
});
OfferSchema.index({ 'commissionDetails.commissionRate': 1 });

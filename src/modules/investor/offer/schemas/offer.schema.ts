import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';
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
  CLOSED = 'closed',
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

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

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

  @Prop({ required: true, enum: OfferStatus, default: OfferStatus.PENDING })
  readonly status: OfferStatus;

  @Prop({ required: true, default: 0 })
  readonly applicationsCount: number;

  @Prop({ type: HarvestBaseDetails })
  readonly harvestBaseDetails?: HarvestBaseDetails;

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
// OfferSchema.index({
//   'commissionDetails.startDate': 1,
//   'commissionDetails.endDate': 1,
// });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  MilestoneI,
  LandRentalI,
  FinancialBreakdownI,
} from '../contracts.types';

@Schema({ timestamps: true })
export class Contract extends Document {
  @Prop({
    type: String,
    enum: ['investor-harvest-base', 'land-owner-ad', 'investor-sponsorship'],
    required: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true })
  offer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'LandOwnerAd' })
  landAd?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  investor?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  farmer?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  landowner?: Types.ObjectId;

  @Prop({ type: String })
  projectName?: string;

  @Prop({ type: String })
  cropType?: string;

  @Prop({ type: String })
  cropIcon?: string;

  @Prop({ type: String })
  location?: string;

  @Prop({ type: String })
  district?: string;

  @Prop({ type: String })
  province?: string;

  @Prop({ type: String })
  coordinates?: string;

  @Prop({ type: Number })
  expectedROI?: number;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'completed', 'terminated'],
    default: 'active',
  })
  status: string;

  @Prop({ type: String, enum: ['harvest', 'commission'] })
  investmentType?: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: String })
  backgroundImage?: string;

  @Prop({ type: String })
  investorName?: string;

  @Prop({ type: Number })
  investorAmount?: number;

  @Prop({ type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskLevel?: string;

  @Prop({ type: String })
  riskStatus?: string;

  @Prop({ type: [Object], default: [] })
  milestones: MilestoneI[];

  @Prop({ type: [Object], default: [] })
  landRentals: LandRentalI[];

  @Prop({ type: [Object], default: [] })
  financialBreakdown: FinancialBreakdownI[];

  @Prop({ type: Boolean, default: false })
  investorConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  farmerConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  landownerConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  fullyConfirmed: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

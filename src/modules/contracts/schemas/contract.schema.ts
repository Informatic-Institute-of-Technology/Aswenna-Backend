import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Offer } from 'src/modules/investor/offer/schemas/offer.schema';
import { LandOwnerAd } from 'src/modules/land-owner/ads/schemas/land-owner-ad.schema';
import { User } from 'src/modules/user/schemas/user.schema';
import { ContractPayment } from 'src/modules/payments/schemas/payment.schema';

// Sub-schemas
@Schema()
export class Milestone {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true })
  readonly title: string;

  @Prop()
  readonly description: string;

  @Prop({ required: true })
  readonly progress: number;

  @Prop({ enum: ['pending', 'in-progress', 'completed'] })
  readonly status: string;

  @Prop({ required: true })
  readonly startDate: Date;

  @Prop({ required: true })
  readonly endDate: Date;

  @Prop()
  readonly completedDate: Date;

  @Prop({ required: true })
  readonly payment: number;
}

export const MilestoneSchema = SchemaFactory.createForClass(Milestone);

@Schema({ _id: false })
export class LandRental {
  @Prop({ required: true })
  readonly id: string;

  @Prop({ required: true })
  readonly landArea: string;

  @Prop({ required: true })
  readonly month: string;

  @Prop({ required: true })
  readonly dueDate: Date;

  @Prop()
  readonly paidDate: Date;

  @Prop({ required: true })
  readonly amount: number;

  @Prop({ enum: ['pending', 'paid', 'overdue'] })
  readonly status: string;
}

export const LandRentalSchema = SchemaFactory.createForClass(LandRental);

@Schema({ _id: false })
export class FinancialBreakdown {
  @Prop({ required: true })
  readonly category: string;

  @Prop({ required: true })
  readonly amount: number;
}

export const FinancialBreakdownSchema =
  SchemaFactory.createForClass(FinancialBreakdown);

// Main Contract Schema
@Schema({ timestamps: true })
export class Contract extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({
    enum: ['investor-harvest-base', 'land-owner-ad', 'investor-sponsorship'],
    required: true,
  })
  readonly type:
    | 'investor-harvest-base'
    | 'land-owner-ad'
    | 'investor-sponsorship';

  @Prop({ type: Types.ObjectId, ref: Offer.name, required: true })
  readonly offer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: LandOwnerAd.name })
  readonly landAd?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly investor: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  readonly farmer?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  readonly landowner: Types.ObjectId;

  @Prop({ required: true })
  readonly projectName: string;

  @Prop()
  readonly cropType: string;

  @Prop()
  readonly cropIcon: string;

  @Prop()
  readonly location: string;

  @Prop()
  readonly district: string;

  @Prop()
  readonly province: string;

  @Prop()
  readonly coordinates: string;

  @Prop()
  readonly expectedROI: number;

  @Prop({ enum: ['active', 'inactive', 'completed', 'terminated'] })
  readonly status: string;

  @Prop({ enum: ['harvest', 'commission'] })
  readonly investmentType: string;

  @Prop()
  readonly startDate: Date;

  @Prop()
  readonly endDate: Date;

  @Prop()
  readonly backgroundImage: string;

  @Prop()
  readonly investorName: string;

  @Prop()
  readonly investorAmount: number;

  @Prop({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  readonly riskLevel: string;

  @Prop()
  readonly riskStatus: string;

  @Prop([MilestoneSchema])
  readonly milestones: Milestone[];

  @Prop([{ type: Types.ObjectId, ref: ContractPayment.name }])
  readonly payments: Types.ObjectId[];

  @Prop([LandRentalSchema])
  readonly landRentals: LandRental[];

  @Prop([FinancialBreakdownSchema])
  readonly financialBreakdown: FinancialBreakdown[];

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop({ default: 'system' })
  readonly updatedBy: string;

  @Prop({ type: Boolean, default: false })
  readonly investorConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  readonly farmerConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  readonly landownerConfirmed: boolean;

  @Prop({ type: Boolean, default: false })
  readonly isFullyConfirmed: boolean;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

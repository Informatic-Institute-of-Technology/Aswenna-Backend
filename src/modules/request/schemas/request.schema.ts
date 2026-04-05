import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { File } from 'src/common/schemas/file.schema';
import { FarmerProject } from 'src/modules/farmer/schemas/farmer-project.schema';
import { Offer } from 'src/modules/investor/offer/schemas/offer.schema';
import { LandOwnerAd } from 'src/modules/land-owner/land-ads/schemas/land-owner-ad.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum JourneyStepStatus {
  COMPLETED = 'completed',
  ACTIVE = 'active',
  PENDING = 'pending',
}

export enum JourneyStepActionType {
  UPLOAD_AGREEMENT = 'upload_agreement',
  SIGN_AGREEMENT = 'sign_agreement',
}

@Schema({ _id: false })
export class RequestCostBreakdownItem {
  @Prop({ required: true })
  readonly title: string;

  @Prop({ required: true })
  readonly estimatedCost!: number;
}

@Schema({ _id: false })
export class RequestMilestoneBreakdownItem {
  @Prop({ required: true })
  readonly title: string;

  @Prop({ required: true })
  readonly estimatedAmount!: number;

  @Prop({ required: true })
  readonly paymentOverDueDate!: Date;

  @Prop({ required: true })
  readonly startDate!: Date;

  @Prop({ required: true })
  readonly endDate!: Date;
}

@Schema()
export class RequestJourneyStep extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true })
  readonly title: string;

  @Prop({ required: true })
  readonly description: string;

  @Prop({ type: Date })
  readonly timestamp?: Date;

  @Prop({
    type: String,
    enum: JourneyStepStatus,
    default: JourneyStepStatus.PENDING,
  })
  readonly status: JourneyStepStatus;

  @Prop()
  readonly icon?: string;

  @Prop({ type: String, enum: JourneyStepActionType })
  readonly actionType?: JourneyStepActionType;
}

@Schema({ timestamps: true })
export class UserRequest extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly recipient: User;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly receiver: User;

  @Prop({ type: Types.ObjectId, ref: Offer.name })
  readonly investorOffer?: Offer;

  @Prop({ type: Types.ObjectId, ref: LandOwnerAd.name })
  readonly landOwnerAd?: LandOwnerAd;

  @Prop({ type: Types.ObjectId, ref: FarmerProject.name })
  readonly farmerProject?: FarmerProject;

  @Prop({ type: String, enum: RequestStatus, default: RequestStatus.PENDING })
  readonly status: RequestStatus;

  @Prop({ required: true })
  readonly description: string;

  @Prop([RequestCostBreakdownItem])
  readonly costBreakdown!: RequestCostBreakdownItem[];

  @Prop([RequestMilestoneBreakdownItem])
  readonly milestoneBreakdown!: RequestMilestoneBreakdownItem[];

  @Prop({ type: [RequestJourneyStep], default: [] })
  readonly journeySteps: RequestJourneyStep[];

  @Prop(File)
  investorAgreement?: File;

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop({ default: 'system' })
  readonly updatedBy: string;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const UserRequestSchema = SchemaFactory.createForClass(UserRequest);

UserRequestSchema.index({ recipient: 1, status: 1 });
UserRequestSchema.index({ receiver: 1, status: 1 });
UserRequestSchema.index({ investorOffer: 1 });
UserRequestSchema.index({ farmerProject: 1 });
UserRequestSchema.index({ createdAt: -1 });

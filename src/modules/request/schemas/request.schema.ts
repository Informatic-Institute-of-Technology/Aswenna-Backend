import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum RequestTargetType {
  OFFER = 'offer',
  LAND_ADS = 'land ads',
  PROJECT = 'project',
}

@Schema({ _id: false })
export class RequestStatusBadge {
  @Prop({ type: String, required: true })
  label: string;

  @Prop({ type: String, required: true })
  variant: string;

  @Prop({ type: String, required: true })
  color: string;
}

@Schema({ _id: false })
export class RequestTag {
  @Prop({ type: String, required: true })
  label: string;

  @Prop({ type: String, required: true })
  variant: string;
}

@Schema()
export class RequestJourneyStep extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String })
  timestamp?: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  icon: string;
}

@Schema({ timestamps: true })
export class UserRequest extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  target: Types.ObjectId;

  @Prop({ type: String, enum: RequestTargetType, required: true })
  targetType: RequestTargetType;

  @Prop({ type: Types.ObjectId, required: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  receiver: Types.ObjectId;

  @Prop({ type: String, enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Prop({ type: RequestStatusBadge, required: true })
  statusBadge: RequestStatusBadge;

  @Prop({ type: [RequestTag], default: [] })
  tags: RequestTag[];

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String })
  investmentAmount?: string;

  @Prop({ type: [RequestJourneyStep], default: [] })
  journeySteps: RequestJourneyStep[];

  @Prop({ type: String })
  insight?: string;

  @Prop({ type: Date })
  timestamp?: Date;

  @Prop({ type: Boolean, default: false })
  highlighted: boolean;

  @Prop(Date)
  createdAt: Date;

  @Prop(Date)
  updatedAt: Date;
}

export const UserRequestSchema = SchemaFactory.createForClass(UserRequest);

UserRequestSchema.index({ recipient: 1, status: 1 });
UserRequestSchema.index({ receiver: 1, status: 1 });
UserRequestSchema.index({ target: 1, targetType: 1 });
UserRequestSchema.index({ createdAt: -1 });

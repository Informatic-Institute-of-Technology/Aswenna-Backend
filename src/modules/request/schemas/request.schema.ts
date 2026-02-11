import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum RequestType {
  PROJECT = 'PROJECT',
  OFFER = 'OFFER',
  LAND = 'LAND',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class InteractionRequest extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  readonly sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  readonly receiver: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  readonly target: Types.ObjectId;

  @Prop({ enum: RequestType })
  readonly targetType: RequestType;

  @Prop({
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  readonly status: RequestStatus;

  @Prop(Date)
  readonly responseAt: Date;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const InteractionRequestSchema =
  SchemaFactory.createForClass(InteractionRequest);

InteractionRequestSchema.index({ receiver: 1, status: 1 });
InteractionRequestSchema.index({ sender: 1, status: 1 });
InteractionRequestSchema.index({ targetId: 1, targetType: 1 });
InteractionRequestSchema.index({ createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OtpType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

@Schema({ timestamps: true })
export class Otp extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  readonly identifier: string;

  @Prop({ required: true, enum: OtpType })
  readonly type: OtpType;

  @Prop({ required: true })
  readonly code: string;

  @Prop({ required: true })
  readonly expiresAt: Date;

  @Prop({ default: false })
  readonly isUsed: boolean;

  @Prop()
  readonly verifiedAt?: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ identifier: 1, type: 1, code: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

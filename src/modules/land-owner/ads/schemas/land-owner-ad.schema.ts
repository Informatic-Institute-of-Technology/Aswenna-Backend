import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { File } from 'src/common/schemas/file.schema';
import { Meta } from 'src/common/schemas/meta.schema';
import { User } from 'src/modules/user/schemas/user.schema';

export enum LandOwnerAdStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class LandOwnerAd extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly landowner: User;

  @Prop({ required: true })
  readonly title: string;

  @Prop({
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    required: true,
    _id: false,
  })
  readonly location: { latitude: number; longitude: number };

  @Prop({ required: true })
  readonly landArea: number;

  @Prop({ required: true })
  readonly rentalAmount: number;

  @Prop({ required: true })
  readonly availableFrom: Date;

  @Prop({ required: true })
  readonly availableTo: Date;

  @Prop({ required: true })
  readonly soilType: string;

  @Prop({ required: true })
  readonly landHistory?: string;

  @Prop({ required: true })
  readonly additionalInfo: string;

  @Prop({ required: true })
  readonly waterAvailability: string;

  @Prop([File])
  readonly images: File[];

  @Prop({
    type: String,
    enum: LandOwnerAdStatus,
    default: LandOwnerAdStatus.ACTIVE,
  })
  readonly status: LandOwnerAdStatus;

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

export const LandOwnerAdSchema = SchemaFactory.createForClass(LandOwnerAd);

LandOwnerAdSchema.index({ landowner: 1, status: 1 });
LandOwnerAdSchema.index({ availableTo: 1, status: 1 });

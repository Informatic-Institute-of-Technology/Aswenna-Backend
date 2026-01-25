import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';

export enum AgreementType {
  HARVEST_BASE = 'HARVEST_BASE',
  COMMISSION_BASE = 'COMMISSION_BASE',
}

@Schema({ timestamps: true })
export class Offer extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ required: true })
  readonly projectName: string;

  @Prop({ required: true })
  readonly cropType: string;

  @Prop({ required: true })
  readonly effectiveDateFrom: Date;

  @Prop({ required: true })
  readonly effectiveDateTo: Date;

  @Prop({ required: true })
  readonly location: string;

  @Prop({ type: [String], default: [] })
  readonly farmingMethods: string[];

  @Prop({ required: true, enum: AgreementType })
  readonly agreementType: AgreementType;

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

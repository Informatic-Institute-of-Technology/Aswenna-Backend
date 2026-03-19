import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FarmerAdDocument = FarmerAd & Document;

@Schema({ timestamps: true })
export class FarmerAd {

  @Prop()
  userId: string;

  @Prop()
  offerType: string;

  @Prop()
  projectName: string;

  @Prop()
  description: string;

  @Prop()
  cropType: string;

  @Prop()
  location: string;

  @Prop()
  effectiveDateFrom: string;

  @Prop()
  effectiveDateTo: string;

  @Prop()
  farmingMethods: string;

  @Prop()
  agreementType: string;

  @Prop([String])
  preferredRegions: string[];

  @Prop()
  expectedHarvest: number;

  @Prop()
  expectedLandArea: number;

  @Prop()
  commissionPercentage: number;

  @Prop()
  investmentAmount: number;

  @Prop()
  noOfInstallments: number;

}

export const FarmerAdSchema = SchemaFactory.createForClass(FarmerAd);
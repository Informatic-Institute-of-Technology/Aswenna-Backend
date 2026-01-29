import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LandAdd extends Document {
  @Prop()
  location: string;

  @Prop({ required: true })
  landArea: string;

  @Prop()
  availableFrom: string;

  @Prop()
  availableTo: string;

  @Prop()
  rentalAmount: number;

  @Prop()
  soilType: string;

  @Prop()
  landHistory: string;

  @Prop()
  additionalInfo: string;

  @Prop({ required: true })
  landOwnerId: string;
}

export const LandAddSchema = SchemaFactory.createForClass(LandAdd);

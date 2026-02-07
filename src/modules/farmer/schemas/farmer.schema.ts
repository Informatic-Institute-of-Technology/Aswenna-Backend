import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';
import { Meta } from 'src/common/schemas/meta.schema';

@Schema({ timestamps: true })
export class Farmer extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  readonly user: User;

  @Prop()
  readonly dsDivision: string;

  @Prop()
  readonly gnDivision: string;

  @Prop()
  readonly govijanaSevaId: string;

  @Prop()
  readonly GovijanaSevaPassbookImage: string;

  @Prop()
  readonly gnCertificateImage: string;

  @Prop()
  readonly crop: string;

  @Prop()
  readonly experience: string;

  @Prop()
  readonly regions: string;

  @Prop()
  readonly specificNeeds: string;

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

export const FarmerSchema = SchemaFactory.createForClass(Farmer);

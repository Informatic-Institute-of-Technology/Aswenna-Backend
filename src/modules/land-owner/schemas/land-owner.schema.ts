import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';
import { Meta } from 'src/common/schemas/meta.schema';

@Schema({ _id: false })
export class LandOwnerLocation {
  @Prop()
  readonly latitude: number;

  @Prop()
  readonly longitude: number;
}

@Schema({ _id: false })
export class LandAddress {
  @Prop()
  readonly street: string;

  @Prop()
  readonly city: string;

  @Prop()
  readonly province: string;

  @Prop()
  readonly district: string;

  @Prop()
  readonly postalCode: string;

  @Prop()
  readonly size: string;

  @Prop()
  readonly soilType: string;

  @Prop()
  readonly rentalExpectation: string;

  @Prop()
  readonly dsDivision: string;

  @Prop()
  readonly gnDivision: string;

  @Prop([String])
  readonly landImages: string[];
}

@Schema({ timestamps: true })
export class LandOwner extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  readonly user: User;

  @Prop()
  readonly dsDivision: string;

  @Prop()
  readonly gnDivision: string;

  @Prop({ type: LandOwnerLocation })
  readonly location: LandOwnerLocation;

  @Prop({ type: LandAddress })
  readonly landAddress: LandAddress;

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

export const LandOwnerSchema = SchemaFactory.createForClass(LandOwner);

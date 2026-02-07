import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/modules/user/schemas/user.schema';
import { Meta } from 'src/common/schemas/meta.schema';

@Schema({ timestamps: true })
export class Investor extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  readonly user: User;

  @Prop()
  readonly dsDivision: string;

  @Prop()
  readonly gnDivision: string;

  @Prop()
  readonly organizationName: string;

  @Prop()
  readonly companyAddress: string;

  @Prop()
  readonly organizationPhoneNumber: string;

  @Prop()
  readonly registrationNo: string;

  @Prop()
  readonly cropFocus: string;

  @Prop([Meta])
  readonly meta: Meta[];

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop({ default: 'system' })
  readonly updatedBy: string;
}

export const InvestorSchema = SchemaFactory.createForClass(Investor);
